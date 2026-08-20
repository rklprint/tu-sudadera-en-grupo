import { eq } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, participants, payments } from "@/db/schema";
import { getAdminApiUser } from "@/lib/admin-auth";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import { sendPaymentReceiptEmail } from "@/lib/order-emails";
import { readJsonBody, rejectCrossOriginMutation } from "@/lib/request-security";
import { trackServerProductEvent } from "@/lib/analytics";

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
      const statements = [DB.prepare("UPDATE payments SET status = ?, active_scope_key = NULL, validated_at = '', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(nextStatus, payment.id)];
      if (payment.participantId) statements.push(DB.prepare("UPDATE participants SET payment_status = 'unpaid', payment_method = '', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(payment.participantId));
      await DB.batch(statements);
      await DB.prepare("INSERT INTO audit_logs (actor, action, entity_type, entity_id, metadata_json) VALUES (?, ?, 'payment', ?, '{}')").bind(admin.email, `transfer_${nextStatus}`, String(payment.id)).run();
      const [updated] = await db.select().from(payments).where(eq(payments.id, payment.id)).limit(1);
      return Response.json({ payment: updated, emailStatus: "not_required" });
    }
    if (payment.status === "confirmed") {
      return Response.json({ payment, emailStatus: "not_required", idempotent: true });
    }
    if (payment.status !== "pending") return Response.json({ error: "Este pago no está pendiente de validación." }, { status: 409 });
    const validatedAt = new Date().toISOString();
    const { DB } = getSiteRuntimeEnv();
    if (!DB) throw new Error("Database unavailable");
    const statements = [
      DB.prepare("UPDATE payments SET status = 'confirmed', active_scope_key = NULL, validated_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(validatedAt, payment.id),
      DB.prepare("INSERT OR IGNORE INTO invoices (payment_id, status) VALUES (?, 'not_requested')").bind(payment.id),
    ];
    if (payment.participantId) statements.push(DB.prepare("UPDATE participants SET payment_status = 'paid', payment_method = 'transfer', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(payment.participantId));
    await DB.batch(statements);
    const totals = await DB.prepare(`SELECT
        coalesce((SELECT sum(oi.unit_price_cents + oi.extras_cents)
          FROM order_items oi
          INNER JOIN participants p ON p.id = oi.participant_id
          WHERE p.group_id = ?), 0) AS expected,
        coalesce((SELECT sum(amount_cents)
          FROM payments
          WHERE group_id = ? AND status = 'confirmed'), 0) AS confirmed`)
      .bind(payment.groupId, payment.groupId)
      .first<{ expected: number; confirmed: number }>();
    if (Number(totals?.expected || 0) > 0 && Number(totals?.expected) === Number(totals?.confirmed)) {
      await DB.batch([
        DB.prepare("UPDATE group_orders SET payment_status = 'complete', production_status = 'queued', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(payment.groupId),
        DB.prepare("UPDATE participants SET payment_status = 'paid', payment_method = CASE WHEN payment_method = '' THEN 'organizer' ELSE payment_method END, updated_at = CURRENT_TIMESTAMP WHERE group_id = ?").bind(payment.groupId),
      ]);
      await trackServerProductEvent("order_completed", { payment_status: "complete" });
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
        orderUrl: new URL(`/pedido/${group.accessCode}`, _request.url).toString(),
      });
    } else {
      const [group] = await db.select().from(groupOrders).where(eq(groupOrders.id, payment.groupId)).limit(1);
      if (group) emailStatus = await sendPaymentReceiptEmail({ to: group.organizerEmail, contactName: group.organizerName, groupName: group.groupName, reference: payment.reference, amountCents: payment.amountCents, orderUrl: new URL(`/pedido/${group.accessCode}`, _request.url).toString() });
    }
    await DB.prepare("INSERT INTO audit_logs (actor, action, entity_type, entity_id, metadata_json) VALUES (?, 'transfer_confirmed', 'payment', ?, '{}')").bind(admin.email, String(payment.id)).run();
    await trackServerProductEvent("payment_completed", { payment_method: "transfer", payment_status: "confirmed" });
    return Response.json({ payment: updated, emailStatus });
  } catch {
    return Response.json({ error: "No hemos podido validar la transferencia." }, { status: 500 });
  }
}
