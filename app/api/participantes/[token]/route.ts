import { eq, or, sql } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, orderItems, participants } from "@/db/schema";
import { extrasForGarmentCents, hashPrivateToken, validateGarments } from "@/lib/group-orders";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import { readJsonBody, rejectCrossOriginMutation, rejectOversizedRequest, takeRateLimit } from "@/lib/request-security";
import { paymentAvailability } from "@/lib/payments/availability";

type RouteContext = { params: Promise<{ token: string }> };

function normalizeToken(value: string) {
  return decodeURIComponent(value).trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

const demo = {
  contactName: "Lucía García",
  email: "lucia@ejemplo.es",
  editable: true,
  paymentStatus: "unpaid",
  group: { code: "TSG-DEMO", name: "PROMO 26", garment: "Gildan 18500", productType: "hoodie", color: "Azul marino", unitPriceCents: 2600, registrationStatus: "open", paymentStatus: "locked" },
  garments: [{ printName: "LUCÍA", size: "M", namePlacement: "front", frontExtra: "coordinates", frontDetail: "40°25′N · 3°42′O", sleeveExtra: "embroidered_flag", sleeveDetail: "Madrid" }],
  amountDueCents: 2900,
  paymentAvailability: { card: false, bizum: false, transfer: false },
};

export async function GET(_request: Request, context: RouteContext) {
  const rateLimitError = takeRateLimit(_request, "participant-view", { limit: 120, windowMs: 10 * 60_000 });
  if (rateLimitError) return rateLimitError;
  const token = normalizeToken((await context.params).token);
  if (token === "TSG-DEMO-EDIT") return Response.json(demo);

  try {
    await ensureQuoteSchema();
    const db = getDb();
    const participant = await findParticipantByToken(token);
    if (!participant) return Response.json({ error: "Este enlace de edición no es válido." }, { status: 404 });
    if (participant.editTokenRevokedAt || (participant.editTokenExpiresAt && Date.parse(participant.editTokenExpiresAt) <= Date.now())) {
      return Response.json({ error: "Este enlace personal ha caducado o ha sido revocado." }, { status: 410 });
    }
    const [group] = await db.select().from(groupOrders).where(eq(groupOrders.id, participant.groupId)).limit(1);
    if (!group) return Response.json({ error: "El grupo ya no está disponible." }, { status: 404 });
    if (group.privateLinkRevokedAt) return Response.json({ error: "El acceso privado de este grupo ha sido revocado." }, { status: 410 });
    const garments = await db.select({
      printName: orderItems.printName,
      size: orderItems.size,
      namePlacement: orderItems.namePlacement,
      frontExtra: orderItems.frontExtra,
      frontDetail: orderItems.frontDetail,
      sleeveExtra: orderItems.sleeveExtra,
      sleeveDetail: orderItems.sleeveDetail,
    }).from(orderItems).where(eq(orderItems.participantId, participant.id));
    const [total] = await db.select({ amountDueCents: sql<number>`coalesce(sum(${orderItems.unitPriceCents} + ${orderItems.extrasCents}), 0)` }).from(orderItems).where(eq(orderItems.participantId, participant.id));

    return Response.json({
      contactName: participant.contactName,
      email: participant.email,
      editable: participant.paymentStatus !== "paid" && group.registrationStatus === "open",
      paymentStatus: participant.paymentStatus,
      group: {
        code: group.accessCode,
        name: group.groupName,
        garment: group.garment,
        productType: group.productType,
        color: group.color,
        unitPriceCents: group.unitPriceCents,
        registrationStatus: group.registrationStatus,
        paymentStatus: group.paymentStatus,
      },
      garments,
      amountDueCents: Number(total?.amountDueCents || 0),
      paymentAvailability: paymentAvailability(),
    });
  } catch {
    return Response.json({ error: "No hemos podido abrir tu selección." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const sizeError = rejectOversizedRequest(request, 128 * 1024);
  if (sizeError) return sizeError;
  const rateLimitError = takeRateLimit(request, "participant-edit", { limit: 30, windowMs: 10 * 60_000 });
  if (rateLimitError) return rateLimitError;

  const token = normalizeToken((await context.params).token);
  try {
    const body = await readJsonBody<{ contactName?: string; email?: string; garments?: unknown }>(request, 128 * 1024);
    if ("response" in body) return body.response;
    const payload = body.data;
    const contactName = String(payload.contactName || "").trim().slice(0, 80);
    const email = String(payload.email || "").trim().toLowerCase().slice(0, 160);
    const validated = validateGarments(payload.garments);
    if (!contactName) return Response.json({ error: "Indica el nombre de contacto." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Indica un correo válido." }, { status: 400 });
    if ("error" in validated) return Response.json({ error: validated.error }, { status: 400 });
    if (token === "TSG-DEMO-EDIT") return Response.json({ ok: true, demo: true });

    await ensureQuoteSchema();
    const db = getDb();
    const participant = await findParticipantByToken(token);
    if (!participant) return Response.json({ error: "Este enlace de edición no es válido." }, { status: 404 });
    if (participant.editTokenRevokedAt || (participant.editTokenExpiresAt && Date.parse(participant.editTokenExpiresAt) <= Date.now())) {
      return Response.json({ error: "Este enlace personal ha caducado o ha sido revocado." }, { status: 410 });
    }
    const [group] = await db.select().from(groupOrders).where(eq(groupOrders.id, participant.groupId)).limit(1);
    if (!group) return Response.json({ error: "El grupo ya no está disponible." }, { status: 404 });
    if (group.privateLinkRevokedAt) return Response.json({ error: "El acceso privado de este grupo ha sido revocado." }, { status: 410 });
    if (participant.paymentStatus === "paid" || group.registrationStatus !== "open") {
      return Response.json({ error: "La selección ya está bloqueada y no puede modificarse." }, { status: 409 });
    }

    const { DB } = getSiteRuntimeEnv();
    if (!DB) throw new Error("Database unavailable");
    const statements = [
      DB.prepare("UPDATE participants SET contact_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(contactName, email, participant.id),
      DB.prepare("DELETE FROM order_items WHERE participant_id = ?").bind(participant.id),
      ...validated.garments.map(garment => DB.prepare(`INSERT INTO order_items (participant_id, product_name, model, color, quantity, print_name, size, name_placement, front_extra, front_detail, sleeve_extra, sleeve_detail, extras_cents, unit_price_cents) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(participant.id, group.productType === "tshirt" ? "Camiseta" : "Sudadera", group.garment, group.color, garment.printName, garment.size, garment.namePlacement, garment.frontExtra, garment.frontDetail, garment.sleeveExtra, garment.sleeveDetail, extrasForGarmentCents(garment) ?? 0, group.unitPriceCents)),
    ];
    await DB.batch(statements);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "No hemos podido actualizar la selección." }, { status: 500 });
  }
}

async function findParticipantByToken(token: string) {
  const db = getDb();
  const tokenHash = await hashPrivateToken(token);
  const [participant] = await db
    .select()
    .from(participants)
    .where(or(eq(participants.editTokenHash, tokenHash), eq(participants.editToken, token)))
    .limit(1);
  return participant;
}
