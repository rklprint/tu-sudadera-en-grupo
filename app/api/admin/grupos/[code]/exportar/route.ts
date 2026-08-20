import { eq } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, orderItems, participants } from "@/db/schema";
import { getAdminApiUser } from "@/lib/admin-auth";
import { normalizeCode } from "@/lib/group-orders";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!await getAdminApiUser()) return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  const code = normalizeCode((await context.params).code);

  try {
    await ensureQuoteSchema();
    const db = getDb();
    const [group] = await db.select().from(groupOrders).where(eq(groupOrders.accessCode, code)).limit(1);
    if (!group) return Response.json({ error: "No existe ese grupo." }, { status: 404 });
    const rows = await db.select({
      contactName: participants.contactName,
      email: participants.email,
      paymentStatus: participants.paymentStatus,
      printName: orderItems.printName,
      size: orderItems.size,
      namePlacement: orderItems.namePlacement,
      frontExtra: orderItems.frontExtra,
      frontDetail: orderItems.frontDetail,
      sleeveExtra: orderItems.sleeveExtra,
      sleeveDetail: orderItems.sleeveDetail,
      extrasCents: orderItems.extrasCents,
      unitPriceCents: orderItems.unitPriceCents,
    }).from(orderItems).innerJoin(participants, eq(orderItems.participantId, participants.id)).where(eq(participants.groupId, group.id));

    const headers = ["Contacto", "Correo", "Estado pago", "Nombre impreso", "Talla", "Nombre en", "Extra pecho", "Detalle pecho", "Extra manga", "Detalle manga", "Precio base", "Extras"];
    const csv = [headers, ...rows.map(row => [row.contactName, row.email, row.paymentStatus, row.printName, row.size, row.namePlacement, row.frontExtra, row.frontDetail, row.sleeveExtra, row.sleeveDetail, (row.unitPriceCents / 100).toFixed(2), (row.extrasCents / 100).toFixed(2)])]
      .map(columns => columns.map(value => `"${String(value).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    return new Response(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${code}-pedido.csv"`, "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "No hemos podido exportar el pedido." }, { status: 500 });
  }
}
