import { eq } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, participants, payments } from "@/db/schema";
import { getAdminApiUser } from "@/lib/admin-auth";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import { sendPaymentReceiptEmail } from "@/lib/order-emails";

type RouteContext = { params: Promise<{ reference: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  if (!await getAdminApiUser()) return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  const reference = decodeURIComponent((await context.params).reference).trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  try {
    await ensureQuoteSchema();
    const db = getDb();
    const [payment] = await db.select().from(payments).where(eq(payments.reference, reference)).limit(1);
    if (!payment) return Response.json({ error: "No existe ese pago." }, { status: 404 });
    if (payment.method !== "transfer") return Response.json({ error: "Solo las transferencias requieren validación manual." }, { status: 409 });
    const validatedAt = new Date().toISOString();
    const { DB } = getSiteRuntimeEnv();
    if (!DB) throw new Error("Database unavailable");
    const statements = [DB.prepare("UPDATE payments SET status = 'confirmed', validated_at = ? WHERE id = ?").bind(validatedAt, payment.id)];
    if (payment.participantId) statements.push(DB.prepare("UPDATE participants SET payment_status = 'paid', payment_method = 'transfer', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(payment.participantId));
    await DB.batch(statements);
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
    }
    return Response.json({ payment: updated, emailStatus });
  } catch {
    return Response.json({ error: "No hemos podido validar la transferencia." }, { status: 500 });
  }
}
