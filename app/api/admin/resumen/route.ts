import { desc, eq } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, orderItems, participants, payments, quoteRequests } from "@/db/schema";
import { getAdminApiUser } from "@/lib/admin-auth";

export async function GET() {
  if (!await getAdminApiUser()) return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  await ensureQuoteSchema();
  const db = getDb();
  const [quotes, groups, paymentRows, items] = await Promise.all([
    db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt)).limit(100),
    db.select().from(groupOrders).orderBy(desc(groupOrders.createdAt)).limit(100),
    db.select().from(payments).orderBy(desc(payments.createdAt)).limit(100),
    db.select({
      id: orderItems.id,
      groupId: participants.groupId,
      contactName: participants.contactName,
      email: participants.email,
      paymentStatus: participants.paymentStatus,
      printName: orderItems.printName,
      size: orderItems.size,
      quantity: orderItems.quantity,
      frontExtra: orderItems.frontExtra,
      frontDetail: orderItems.frontDetail,
      sleeveExtra: orderItems.sleeveExtra,
      sleeveDetail: orderItems.sleeveDetail,
      extrasCents: orderItems.extrasCents,
      unitPriceCents: orderItems.unitPriceCents,
    }).from(orderItems).innerJoin(participants, eq(orderItems.participantId, participants.id)).orderBy(desc(orderItems.createdAt)).limit(500),
  ]);
  return Response.json({ quotes, groups, payments: paymentRows, items }, { headers: { "Cache-Control": "no-store, private" } });
}
