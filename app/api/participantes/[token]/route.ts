import { eq } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, orderItems, participants } from "@/db/schema";
import { extrasForGarmentCents, validateGarments } from "@/lib/group-orders";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";

type RouteContext = { params: Promise<{ token: string }> };

function normalizeToken(value: string) {
  return decodeURIComponent(value).trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

const demo = {
  contactName: "Lucía García",
  email: "lucia@ejemplo.es",
  editable: true,
  paymentStatus: "unpaid",
  group: { code: "TSG-DEMO", name: "PROMO 26", garment: "Gildan 18500", color: "Azul marino", unitPriceCents: 2600, registrationStatus: "open", paymentStatus: "locked" },
  garments: [{ printName: "LUCÍA", size: "M", namePlacement: "front", frontExtra: "coordinates", frontDetail: "40°25′N · 3°42′O", sleeveExtra: "embroidered_flag", sleeveDetail: "Madrid" }],
};

export async function GET(_request: Request, context: RouteContext) {
  const token = normalizeToken((await context.params).token);
  if (token === "TSG-DEMO-EDIT") return Response.json(demo);

  try {
    await ensureQuoteSchema();
    const db = getDb();
    const [participant] = await db.select().from(participants).where(eq(participants.editToken, token)).limit(1);
    if (!participant) return Response.json({ error: "Este enlace de edición no es válido." }, { status: 404 });
    const [group] = await db.select().from(groupOrders).where(eq(groupOrders.id, participant.groupId)).limit(1);
    if (!group) return Response.json({ error: "El grupo ya no está disponible." }, { status: 404 });
    const garments = await db.select({
      printName: orderItems.printName,
      size: orderItems.size,
      namePlacement: orderItems.namePlacement,
      frontExtra: orderItems.frontExtra,
      frontDetail: orderItems.frontDetail,
      sleeveExtra: orderItems.sleeveExtra,
      sleeveDetail: orderItems.sleeveDetail,
    }).from(orderItems).where(eq(orderItems.participantId, participant.id));

    return Response.json({
      contactName: participant.contactName,
      email: participant.email,
      editable: participant.paymentStatus !== "paid" && group.registrationStatus === "open",
      paymentStatus: participant.paymentStatus,
      group: {
        code: group.accessCode,
        name: group.groupName,
        garment: group.garment,
        color: group.color,
        unitPriceCents: group.unitPriceCents,
        registrationStatus: group.registrationStatus,
        paymentStatus: group.paymentStatus,
      },
      garments,
    });
  } catch {
    return Response.json({ error: "No hemos podido abrir tu selección." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const token = normalizeToken((await context.params).token);
  try {
    const payload = await request.json() as { contactName?: string; email?: string; garments?: unknown };
    const contactName = String(payload.contactName || "").trim().slice(0, 80);
    const email = String(payload.email || "").trim().toLowerCase().slice(0, 160);
    const validated = validateGarments(payload.garments);
    if (!contactName) return Response.json({ error: "Indica el nombre de contacto." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Indica un correo válido." }, { status: 400 });
    if ("error" in validated) return Response.json({ error: validated.error }, { status: 400 });
    if (token === "TSG-DEMO-EDIT") return Response.json({ ok: true, demo: true });

    await ensureQuoteSchema();
    const db = getDb();
    const [participant] = await db.select().from(participants).where(eq(participants.editToken, token)).limit(1);
    if (!participant) return Response.json({ error: "Este enlace de edición no es válido." }, { status: 404 });
    const [group] = await db.select().from(groupOrders).where(eq(groupOrders.id, participant.groupId)).limit(1);
    if (!group) return Response.json({ error: "El grupo ya no está disponible." }, { status: 404 });
    if (participant.paymentStatus === "paid" || group.registrationStatus !== "open") {
      return Response.json({ error: "La selección ya está bloqueada y no puede modificarse." }, { status: 409 });
    }

    const { DB } = getSiteRuntimeEnv();
    if (!DB) throw new Error("Database unavailable");
    const statements = [
      DB.prepare("UPDATE participants SET contact_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(contactName, email, participant.id),
      DB.prepare("DELETE FROM order_items WHERE participant_id = ?").bind(participant.id),
      ...validated.garments.map(garment => DB.prepare(`INSERT INTO order_items (participant_id, print_name, size, name_placement, front_extra, front_detail, sleeve_extra, sleeve_detail, extras_cents, unit_price_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(participant.id, garment.printName, garment.size, garment.namePlacement, garment.frontExtra, garment.frontDetail, garment.sleeveExtra, garment.sleeveDetail, extrasForGarmentCents(garment) ?? 0, group.unitPriceCents)),
    ];
    await DB.batch(statements);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "No hemos podido actualizar la selección." }, { status: 500 });
  }
}
