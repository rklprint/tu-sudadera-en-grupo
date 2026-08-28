import { eq } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, orderItems, participants } from "@/db/schema";
import { getAdminApiUser } from "@/lib/admin-auth";
import { readJsonBody, rejectCrossOriginMutation, rejectOversizedRequest } from "@/lib/request-security";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const sizeError = rejectOversizedRequest(request, 16 * 1024);
  if (sizeError) return sizeError;
  if (!await getAdminApiUser()) return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Prenda no válida." }, { status: 400 });

  try {
    const body = await readJsonBody<{ extrasCents?: number }>(request, 16 * 1024);
    if ("response" in body) return body.response;
    const payload = body.data;
    const extrasCents = Number(payload.extrasCents);
    if (!Number.isInteger(extrasCents) || extrasCents < 0 || extrasCents > 100000) return Response.json({ error: "Define un importe de extras válido." }, { status: 400 });
    await ensureQuoteSchema();
    const db = getDb();
    const [item] = await db.select({
      id: orderItems.id,
      participantId: orderItems.participantId,
      paymentStatus: participants.paymentStatus,
      groupId: participants.groupId,
    }).from(orderItems).innerJoin(participants, eq(orderItems.participantId, participants.id)).where(eq(orderItems.id, id)).limit(1);
    if (!item) return Response.json({ error: "No existe esa prenda." }, { status: 404 });
    const [group] = await db.select().from(groupOrders).where(eq(groupOrders.id, item.groupId)).limit(1);
    if (!group) return Response.json({ error: "El grupo no está disponible." }, { status: 404 });
    if (item.paymentStatus === "paid" || group.paymentStatus !== "locked") return Response.json({ error: "Los extras no pueden cambiarse después de abrir el pago." }, { status: 409 });
    const [updated] = await db.update(orderItems).set({ extrasCents, updatedAt: new Date().toISOString() }).where(eq(orderItems.id, id)).returning();
    return Response.json({ item: updated });
  } catch {
    return Response.json({ error: "No hemos podido actualizar los extras." }, { status: 500 });
  }
}
