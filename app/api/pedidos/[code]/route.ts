import { and, count, eq, sql, sum } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, orderItems, participants, payments, quoteRequests } from "@/db/schema";
import { createEditToken, createEditTokenExpiry, extrasForGarmentCents, hashPrivateToken, normalizeCode, validateGarments } from "@/lib/group-orders";
import { sendParticipantEditEmail } from "@/lib/participant-email";
import { readJsonBody, rejectCrossOriginMutation, rejectOversizedRequest, takeRateLimit } from "@/lib/request-security";
import { paymentAvailability } from "@/lib/payments/availability";
import { reportServerError } from "@/lib/observability";
import { demoRoutesEnabled } from "@/lib/demo-routes";
import { getAppUrl } from "@/lib/app-origin";

type RouteContext = { params: Promise<{ code: string }> };

const demoOrder = {
  kind: "approved" as const,
  code: "TSG-DEMO",
  status: "registration_open",
  phase: "registration" as const,
  groupName: "PROMO 26",
  garment: "Gildan 18500",
  productType: "hoodie",
  color: "Azul marino",
  estimatedQuantity: 25,
  unitPriceCents: 2600,
  designStatus: "approved",
  registrationStatus: "open",
  paymentStatus: "locked",
  productionStatus: "planning",
  deadline: "30 de septiembre",
  registeredPeople: 18,
  registeredGarments: 21,
  paidPeople: 0,
  paidGarments: 0,
  amountCollectedCents: 0,
  amountOutstandingCents: 54600,
  sizeDistribution: [
    { size: "S", quantity: 3 },
    { size: "M", quantity: 7 },
    { size: "L", quantity: 6 },
    { size: "XL", quantity: 3 },
    { size: "2XL", quantity: 2 },
  ],
  paymentAvailability: { card: false, bizum: false, transfer: false },
};

export async function GET(_request: Request, context: RouteContext) {
  const rateLimitError = takeRateLimit(_request, "group-view", { limit: 120, windowMs: 10 * 60_000 });
  if (rateLimitError) return rateLimitError;
  const { code: rawCode } = await context.params;
  const code = normalizeCode(rawCode);

  if (code === "TSG-DEMO" && demoRoutesEnabled()) return Response.json(demoOrder);

  try {
    await ensureQuoteSchema();
    const db = getDb();
    const [group] = await db.select().from(groupOrders).where(and(eq(groupOrders.accessCode, code), eq(groupOrders.privateLinkRevokedAt, ""))).limit(1);

    if (group) {
      const [peopleResult] = await db
        .select({
          registeredPeople: count(participants.id),
          paidPeople: sql<number>`sum(case when ${participants.paymentStatus} = 'paid' then 1 else 0 end)`,
        })
        .from(participants)
        .where(eq(participants.groupId, group.id));

      const [garmentResult] = await db
        .select({
          registeredGarments: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
          registeredValueCents: sql<number>`coalesce(sum((${orderItems.unitPriceCents} + ${orderItems.extrasCents}) * ${orderItems.quantity}), 0)`,
          paidGarments: sql<number>`coalesce(sum(case when ${participants.paymentStatus} = 'paid' then ${orderItems.quantity} else 0 end), 0)`,
        })
        .from(orderItems)
        .innerJoin(participants, eq(orderItems.participantId, participants.id))
        .where(eq(participants.groupId, group.id));

      const [paymentResult] = await db
        .select({ amountCollectedCents: sum(payments.amountCents) })
        .from(payments)
        .where(and(eq(payments.groupId, group.id), eq(payments.status, "confirmed")));

      const sizeDistribution = await db
        .select({ size: orderItems.size, quantity: sql<number>`coalesce(sum(${orderItems.quantity}), 0)` })
        .from(orderItems)
        .innerJoin(participants, eq(orderItems.participantId, participants.id))
        .where(eq(participants.groupId, group.id))
        .groupBy(orderItems.size);

      const registeredValueCents = Number(garmentResult?.registeredValueCents || 0);
      const amountCollectedCents = Number(paymentResult?.amountCollectedCents || 0);
      const phase = group.registrationStatus === "open" ? "registration" : group.paymentStatus === "open" ? "payment" : group.productionStatus !== "planning" ? "production" : "closed";

      return Response.json({
        kind: "approved",
        code: group.accessCode,
        status: `${phase}_${phase === "registration" ? group.registrationStatus : phase === "payment" ? group.paymentStatus : group.productionStatus}`,
        phase,
        groupName: group.groupName,
        garment: group.garment,
        productType: group.productType,
        color: group.color,
        estimatedQuantity: group.estimatedQuantity,
        unitPriceCents: group.unitPriceCents,
        designStatus: group.designStatus,
        registrationStatus: group.registrationStatus,
        paymentStatus: group.paymentStatus,
        productionStatus: group.productionStatus,
        deadline: group.deadline,
        registeredPeople: Number(peopleResult?.registeredPeople || 0),
        registeredGarments: Number(garmentResult?.registeredGarments || 0),
        paidPeople: Number(peopleResult?.paidPeople || 0),
        paidGarments: Number(garmentResult?.paidGarments || 0),
        amountCollectedCents,
        amountOutstandingCents: Math.max(0, registeredValueCents - amountCollectedCents),
        sizeDistribution,
        paymentAvailability: paymentAvailability(),
      });
    }

    const [quote] = await db
      .select({
        code: quoteRequests.code,
        status: quoteRequests.status,
        groupType: quoteRequests.groupType,
        location: quoteRequests.location,
        quantity: quoteRequests.quantity,
        configurationJson: quoteRequests.configurationJson,
        createdAt: quoteRequests.createdAt,
      })
      .from(quoteRequests)
      .where(eq(quoteRequests.code, code))
      .limit(1);

    if (!quote) return Response.json({ error: "No encontramos ningún pedido con ese código." }, { status: 404 });

    let configuration: Record<string, string> = {};
    try { configuration = JSON.parse(quote.configurationJson) as Record<string, string>; } catch { configuration = {}; }

    return Response.json({
      kind: "quote",
      code: quote.code,
      status: quote.status,
      groupName: configuration.groupName || quote.groupType,
      garment: configuration.model || "Gildan 18500",
      color: configuration.color || "Por confirmar",
      estimatedQuantity: quote.quantity,
      location: quote.location,
      createdAt: quote.createdAt,
    });
  } catch (error) {
    reportServerError(error, "group");
    return Response.json({ error: "No hemos podido consultar el pedido ahora mismo." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const sizeError = rejectOversizedRequest(request, 128 * 1024);
  if (sizeError) return sizeError;
  const rateLimitError = takeRateLimit(request, "participant-register", { limit: 20, windowMs: 10 * 60_000 });
  if (rateLimitError) return rateLimitError;

  const { code: rawCode } = await context.params;
  const code = normalizeCode(rawCode);

  try {
    const body = await readJsonBody<{ contactName?: string; email?: string; garments?: unknown }>(request, 128 * 1024);
    if ("response" in body) return body.response;
    const payload = body.data;
    const contactName = String(payload.contactName || "").trim().slice(0, 80);
    const email = String(payload.email || "").trim().toLowerCase().slice(0, 160);
    const validated = validateGarments(payload.garments);

    if (!contactName) return Response.json({ error: "Indica el nombre de contacto." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Indica un correo electrónico válido." }, { status: 400 });
    if ("error" in validated) return Response.json({ error: validated.error }, { status: 400 });

    if (code === "TSG-DEMO" && demoRoutesEnabled()) {
      return Response.json({
        ok: true,
        demo: true,
        emailStatus: "demo",
        editUrl: "/participante/TSG-DEMO-EDIT",
        garments: validated.garments.length,
      }, { status: 201 });
    }

    await ensureQuoteSchema();
    const db = getDb();
    const [group] = await db.select().from(groupOrders).where(and(eq(groupOrders.accessCode, code), eq(groupOrders.privateLinkRevokedAt, ""))).limit(1);
    if (!group) return Response.json({ error: "No encontramos este grupo." }, { status: 404 });
    if (group.registrationStatus !== "open") return Response.json({ error: "El registro de este grupo ya está cerrado." }, { status: 409 });

    const editToken = createEditToken();
    const editTokenHash = await hashPrivateToken(editToken);
    const [participant] = await db.insert(participants).values({
      groupId: group.id,
      editToken: `hashed_${editTokenHash}`,
      editTokenHash,
      editTokenExpiresAt: createEditTokenExpiry(),
      email,
      contactName,
    }).returning({ id: participants.id });

    try {
      await db.insert(orderItems).values(validated.garments.map(garment => ({
        participantId: participant.id,
        productName: group.productType === "tshirt" ? "Camiseta" : "Sudadera",
        model: group.garment,
        color: group.color,
        quantity: 1,
        printName: garment.printName,
        size: garment.size,
        namePlacement: garment.namePlacement,
        frontExtra: garment.frontExtra,
        frontDetail: garment.frontDetail,
        sleeveExtra: garment.sleeveExtra,
        sleeveDetail: garment.sleeveDetail,
        extrasCents: extrasForGarmentCents(garment) ?? 0,
        unitPriceCents: group.unitPriceCents,
      })));
    } catch (error) {
      await db.delete(participants).where(eq(participants.id, participant.id));
      throw error;
    }

    const editUrl = getAppUrl(`/participante/${editToken}`);
    const emailStatus = await sendParticipantEditEmail({ to: email, contactName, groupName: group.groupName, editUrl });

    return Response.json({ ok: true, emailStatus, editUrl, garments: validated.garments.length }, { status: 201 });
  } catch (error) {
    reportServerError(error, "registration");
    return Response.json({ error: "No hemos podido guardar el registro. Inténtalo de nuevo." }, { status: 500 });
  }
}
