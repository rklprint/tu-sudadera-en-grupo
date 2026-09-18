import { eq } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, participants, payments } from "@/db/schema";
import { getAdminApiUser } from "@/lib/admin-auth";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import { sendPaymentReceiptEmail } from "@/lib/order-emails";
import { readJsonBody, rejectCrossOriginMutation } from "@/lib/request-security";
import { trackServerProductEvent } from "@/lib/analytics";
import { getAppUrl } from "@/lib/app-origin";

type RouteContext = { params: Promise<{ reference: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  const originError = rejectCrossOriginMutation(_request);
  if (originError) return originError;
  const admin = await getAdminApiUser();
  if (!admin) return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  const reference = decodeURIComponent((await context.params).reference).trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  try {
    const body = await readJsonBody<{ action?: "confirm" | "reject" | "cancel" }>(_request, 16 * 1024);
    if ("response" in body) return body.response;
    const payload = body.data;
    const action = payload.action || "confirm";
    await ensureQuoteSchema();
    const db = getDb();
    const [payment] = await db.select().from(payments).where(eq(payments.reference, reference)).limit(1);
    if (!payment) return Response.json({ error: "No existe ese pago." }, { status: 404 });
    if (payment.method !== "transfer") return Response.json({ error: "Solo las transferencias requieren validación manual." }, { status: 409 });
    if (action !== "confirm") {
      const nextStatus = action === "reject" ? "rejected" : "cancelled";
      if (payment.status === "confirmed") return Response.json({ error: "Un pago ya confirmado no puede rechazarse ni cancelarse sin una operación de devolución." }, { status: 409 });
      const { DB } = getSiteRuntimeEnv();
      if (!DB) throw new Error("Database unavailable");
      const statements = [
        DB.prepare("UPDATE payments SET status = ?, active_scope_key = NULL, validated_at = '', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'").bind(nextStatus, payment.id),
        DB.prepare("INSERT OR IGNORE INTO payment_events (payment_id, provider, event_key, event_type, payload_hash) SELECT ?, 'manual', ?, ?, '' WHERE EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = ?)").bind(payment.id, `manual:${payment.id}:${nextStatus}`, `payment_${nextStatus}`, payment.id, nextStatus),
      ];
      if (payment.participantId) statements.push(DB.prepare("UPDATE participants SET payment_status = 'unpaid', payment_method = '', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = ?)").bind(payment.participantId, payment.id, nextStatus));
      const results = await DB.batch(statements);
      const transitioned = Number((results[0] as { meta?: { changes?: number } })?.meta?.changes || 0) > 0;
      if (transitioned) await DB.prepare("INSERT INTO audit_logs (actor, action, entity_type, entity_id, metadata_json) VALUES (?, ?, 'payment', ?, '{}')").bind(admin.email, `transfer_${nextStatus}`, String(payment.id)).run();
      const [updated] = await db.select().from(payments).where(eq(payments.id, payment.id)).limit(1);
      if (!transitioned && updated.status !== nextStatus) return Response.json({ error: "La transferencia ya no está pendiente." }, { status: 409 });
      return Response.json({ payment: updated, emailStatus: "not_required", idempotent: !transitioned });
    }
    if (payment.status === "confirmed") {
      return Response.json({ payment, emailStatus: "not_required", idempotent: true });
    }
    if (payment.status !== "pending") return Response.json({ error: "Este pago no está pendiente de validación." }, { status: 409 });
    const validatedAt = new Date().toISOString();
    const { DB } = getSiteRuntimeEnv();
    if (!DB) throw new Error("Database unavailable");
    const statements = [
      DB.prepare(`UPDATE payments
        SET status = 'confirmed', active_scope_key = NULL, validated_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'pending'
          AND (? IS NULL OR NOT EXISTS (SELECT 1 FROM payments AS paid_scope WHERE paid_scope.participant_id = ? AND paid_scope.status = 'confirmed'))
          AND amount_cents + coalesce((SELECT sum(confirmed.amount_cents) FROM payments AS confirmed WHERE confirmed.group_id = ? AND confirmed.status = 'confirmed'), 0)
            <= coalesce((SELECT sum((oi.unit_price_cents + oi.extras_cents) * oi.quantity) FROM order_items oi INNER JOIN participants participant ON participant.id = oi.participant_id WHERE participant.group_id = ?), 0)`)
        .bind(validatedAt, payment.id, payment.participantId, payment.participantId, payment.groupId, payment.groupId),
      DB.prepare("INSERT OR IGNORE INTO payment_events (payment_id, provider, event_key, event_type, payload_hash) SELECT ?, 'manual', ?, 'payment_confirmed', '' WHERE EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = 'confirmed')").bind(payment.id, `manual:${payment.id}:confirmed`, payment.id),
      DB.prepare("INSERT OR IGNORE INTO invoices (payment_id, status) SELECT ?, 'not_requested' WHERE EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = 'confirmed')").bind(payment.id, payment.id),
    ];
    if (payment.participantId) statements.push(DB.prepare("UPDATE participants SET payment_status = 'paid', payment_method = 'transfer', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = 'confirmed')").bind(payment.participantId, payment.id));
    const results = await DB.batch(statements);
    const transitioned = Number((results[0] as { meta?: { changes?: number } })?.meta?.changes || 0) > 0;
    if (!transitioned) {
      const [current] = await db.select().from(payments).where(eq(payments.id, payment.id)).limit(1);
      if (current.status === "confirmed") return Response.json({ payment: current, emailStatus: "not_required", idempotent: true });
      return Response.json({ error: "La transferencia ya no está pendiente o superaría el total válido del grupo." }, { status: 409 });
    }
    const totals = await DB.prepare(`SELECT
        coalesce((SELECT sum((oi.unit_price_cents + oi.extras_cents) * oi.quantity)
          FROM order_items oi
          INNER JOIN participants p ON p.id = oi.participant_id
          WHERE p.group_id = ?), 0) AS expected,
        coalesce((SELECT sum(amount_cents)
          FROM payments
          WHERE group_id = ? AND status = 'confirmed'), 0) AS confirmed`)
      .bind(payment.groupId, payment.groupId)
      .first<{ expected: number; confirmed: number }>();
    if (Number(totals?.expected || 0) > 0 && Number(totals?.expected) === Number(totals?.confirmed)) {
      const completion = await DB.batch([
        DB.prepare("UPDATE group_orders SET payment_status = 'complete', production_status = 'queued', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND payment_status = 'open'").bind(payment.groupId),
        DB.prepare("UPDATE participants SET payment_status = 'paid', payment_method = CASE WHEN payment_method = '' THEN 'organizer' ELSE payment_method END, updated_at = CURRENT_TIMESTAMP WHERE group_id = ?").bind(payment.groupId),
      ]);
      if (Number((completion[0] as { meta?: { changes?: number } })?.meta?.changes || 0) > 0) await trackServerProductEvent("order_completed", { payment_status: "complete" });
    }
    const [updated] = await db.select().from(payments).where(eq(payments.id, payment.id)).limit(1);
    let emailStatus: string = "not_required";
    if (payment.participantId) {
      const [participant] = await db.select().from(participants).where(eq(participants.id, payment.participantId)).limit(1);
      const [group] = await db.select().from(groupOrders).where(eq(groupOrders.id, payment.groupId)).limit(1);
      if (participant && group) emailStatus = await sendPaymentReceiptEmail({
        to: participant.email,
        contactName: participant.contactName,
        groupName: group.groupName,
        reference: payment.reference,
        amountCents: payment.amountCents,
        orderUrl: getAppUrl(`/pedido/${group.accessCode}`),
      });
    } else {
      const [group] = await db.select().from(groupOrders).where(eq(groupOrders.id, payment.groupId)).limit(1);
      if (group) emailStatus = await sendPaymentReceiptEmail({ to: group.organizerEmail, contactName: group.organizerName, groupName: group.groupName, reference: payment.reference, amountCents: payment.amountCents, orderUrl: getAppUrl(`/pedido/${group.accessCode}`) });
    }
    await DB.prepare("INSERT INTO audit_logs (actor, action, entity_type, entity_id, metadata_json) VALUES (?, 'transfer_confirmed', 'payment', ?, '{}')").bind(admin.email, String(payment.id)).run();
    await trackServerProductEvent("payment_completed", { payment_method: "transfer", payment_status: "confirmed" });
    return Response.json({ payment: updated, emailStatus });
  } catch {
    return Response.json({ error: "No hemos podido validar la transferencia." }, { status: 500 });
  }
}
