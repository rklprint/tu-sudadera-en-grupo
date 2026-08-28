import { ensureQuoteSchema } from "@/db";
import { trackServerProductEvent } from "@/lib/analytics";
import { sendPaymentReceiptEmail } from "@/lib/order-emails";
import { getRedsysConfig, parseAndVerifyRedsysNotification } from "@/lib/payments/redsys";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import { rejectOversizedRequest, takeRateLimit } from "@/lib/request-security";
import { reportServerError } from "@/lib/observability";
import { getAppUrl } from "@/lib/app-origin";

export async function POST(request: Request) {
  const sizeError = rejectOversizedRequest(request, 64 * 1024);
  if (sizeError) return sizeError;
  const limited = takeRateLimit(request, "redsys_notification", { limit: 300, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const config = getRedsysConfig();
  if (!config) return callbackResponse("TPV no configurado", 503);

  try {
    const form = await request.formData();
    const signatureVersion = String(form.get("Ds_SignatureVersion") || form.get("DS_SIGNATUREVERSION") || "");
    const merchantParameters = String(form.get("Ds_MerchantParameters") || form.get("DS_MERCHANTPARAMETERS") || "");
    const signature = String(form.get("Ds_Signature") || form.get("DS_SIGNATURE") || "");
    const notification = await parseAndVerifyRedsysNotification(signatureVersion, merchantParameters, signature, config);
    if (notification.merchantCode !== config.merchantCode || Number(notification.terminal) !== Number(config.terminal) || notification.currency !== "978") return callbackResponse("Datos de comercio no válidos", 400);

    await ensureQuoteSchema();
    const { DB } = getSiteRuntimeEnv();
    if (!DB) throw new Error("Database unavailable");
    const payment = await DB.prepare(`SELECT p.id, p.group_id, p.participant_id, p.reference, p.method, p.amount_cents, p.status, g.access_code, g.group_name, g.organizer_name, g.organizer_email FROM payments p INNER JOIN group_orders g ON g.id = p.group_id WHERE p.provider = 'redsys' AND p.merchant_order = ?`).bind(notification.order).first<{ id: number; group_id: number; participant_id: number | null; reference: string; method: string; amount_cents: number; status: string; access_code: string; group_name: string; organizer_name: string; organizer_email: string }>();
    if (!payment) return callbackResponse("Operación desconocida", 404);
    if (notification.amountCents !== payment.amount_cents || notification.merchantData !== payment.reference) return callbackResponse("Importe o referencia no coincidente", 409);

    const eventKey = `redsys:${notification.order}:${notification.responseCode}:${notification.authorizationCode || "none"}`;
    const existingEvent = await DB.prepare("SELECT id FROM payment_events WHERE event_key = ?").bind(eventKey).first<{ id: number }>();
    if (existingEvent || (notification.successful && payment.status === "confirmed")) return callbackResponse("OK");

    if (!notification.successful) {
      const results = await DB.batch([
        DB.prepare("UPDATE payments SET status = 'failed', active_scope_key = NULL, response_code = ?, callback_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'processing'").bind(notification.responseCode, notification.payloadHash, payment.id),
        DB.prepare("INSERT OR IGNORE INTO payment_events (payment_id, provider, event_key, event_type, payload_hash) SELECT ?, 'redsys', ?, 'payment_failed', ? WHERE EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = 'failed' AND callback_hash = ?)").bind(payment.id, eventKey, notification.payloadHash, payment.id, notification.payloadHash),
      ]);
      if (Number((results[0] as { meta?: { changes?: number } })?.meta?.changes || 0) > 0) {
        await trackServerProductEvent("payment_failed", { payment_method: payment.method, payment_status: "failed" });
      }
      return callbackResponse("OK");
    }

    const validatedAt = new Date().toISOString();
    const statements = [
      DB.prepare(`UPDATE payments
        SET status = 'confirmed', active_scope_key = NULL, provider_transaction_id = ?, response_code = ?, callback_hash = ?, validated_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'processing'
          AND (? IS NULL OR NOT EXISTS (SELECT 1 FROM payments AS paid_scope WHERE paid_scope.participant_id = ? AND paid_scope.status = 'confirmed'))
          AND ? + coalesce((SELECT sum(confirmed.amount_cents) FROM payments AS confirmed WHERE confirmed.group_id = ? AND confirmed.status = 'confirmed'), 0)
            <= coalesce((SELECT sum((oi.unit_price_cents + oi.extras_cents) * oi.quantity) FROM order_items oi INNER JOIN participants participant ON participant.id = oi.participant_id WHERE participant.group_id = ?), 0)`)
        .bind(notification.authorizationCode, notification.responseCode, notification.payloadHash, validatedAt, payment.id, payment.participant_id, payment.participant_id, payment.amount_cents, payment.group_id, payment.group_id),
      DB.prepare("INSERT OR IGNORE INTO payment_events (payment_id, provider, event_key, event_type, payload_hash) SELECT ?, 'redsys', ?, 'payment_confirmed', ? WHERE EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = 'confirmed' AND callback_hash = ?)").bind(payment.id, eventKey, notification.payloadHash, payment.id, notification.payloadHash),
      DB.prepare("INSERT OR IGNORE INTO invoices (payment_id, status) SELECT ?, 'not_requested' WHERE EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = 'confirmed' AND callback_hash = ?)").bind(payment.id, payment.id, notification.payloadHash),
    ];
    if (payment.participant_id) statements.push(DB.prepare("UPDATE participants SET payment_status = 'paid', payment_method = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = 'confirmed' AND callback_hash = ?)").bind(payment.method, payment.participant_id, payment.id, notification.payloadHash));
    const results = await DB.batch(statements);
    const transitioned = Number((results[0] as { meta?: { changes?: number } })?.meta?.changes || 0) > 0;
    if (!transitioned) {
      const current = await DB.prepare("SELECT status FROM payments WHERE id = ?").bind(payment.id).first<{ status: string }>();
      if (current?.status === "confirmed") return callbackResponse("OK");
      reportServerError(new Error(`Redsys success ignored for payment ${payment.id} in state ${current?.status || "unknown"}`), "payment_callback_state_conflict");
      return callbackResponse("Operación fuera de estado; requiere conciliación", 409);
    }

    const totals = await DB.prepare(`SELECT coalesce((SELECT sum((oi.unit_price_cents + oi.extras_cents) * oi.quantity) FROM order_items oi INNER JOIN participants p ON p.id = oi.participant_id WHERE p.group_id = ?), 0) AS expected, coalesce((SELECT sum(amount_cents) FROM payments WHERE group_id = ? AND status = 'confirmed'), 0) AS confirmed`).bind(payment.group_id, payment.group_id).first<{ expected: number; confirmed: number }>();
    if (Number(totals?.expected || 0) > 0 && Number(totals?.expected) === Number(totals?.confirmed)) {
      const completion = await DB.batch([
        DB.prepare("UPDATE group_orders SET payment_status = 'complete', production_status = 'queued', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND payment_status = 'open'").bind(payment.group_id),
        DB.prepare("UPDATE participants SET payment_status = 'paid', payment_method = CASE WHEN payment_method = '' THEN 'organizer' ELSE payment_method END, updated_at = CURRENT_TIMESTAMP WHERE group_id = ?").bind(payment.group_id),
      ]);
      if (Number((completion[0] as { meta?: { changes?: number } })?.meta?.changes || 0) > 0) {
        await trackServerProductEvent("order_completed", { payment_status: "complete" });
      }
    }

    if (transitioned) {
      let receipt = { to: payment.organizer_email, contactName: payment.organizer_name };
      if (payment.participant_id) {
        const participant = await DB.prepare("SELECT email, contact_name FROM participants WHERE id = ?").bind(payment.participant_id).first<{ email: string; contact_name: string }>();
        if (participant) receipt = { to: participant.email, contactName: participant.contact_name };
      }
      await sendPaymentReceiptEmail({ to: receipt.to, contactName: receipt.contactName, groupName: payment.group_name, reference: payment.reference, amountCents: payment.amount_cents, orderUrl: getAppUrl(`/pedido/${payment.access_code}`) });
      await trackServerProductEvent("payment_completed", { payment_method: payment.method, payment_status: "confirmed" });
    }
    return callbackResponse("OK");
  } catch (error) {
    reportServerError(error, "payment_callback");
    return callbackResponse("Notificación no válida", 400);
  }
}

function callbackResponse(message: string, status = 200) {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" } });
}
