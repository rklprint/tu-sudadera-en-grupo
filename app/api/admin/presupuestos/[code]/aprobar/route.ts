import { and, eq } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, quoteRequests } from "@/db/schema";
import { getAdminApiUser } from "@/lib/admin-auth";
import { createAccessCode, normalizeCode, priceForQuantityCents } from "@/lib/group-orders";
import { sendOrganizerGroupEmail } from "@/lib/order-emails";
import { readJsonBody, rejectCrossOriginMutation, rejectOversizedRequest } from "@/lib/request-security";
import { trackServerProductEvent } from "@/lib/analytics";
import { reportServerError } from "@/lib/observability";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const sizeError = rejectOversizedRequest(request, 32 * 1024);
  if (sizeError) return sizeError;
  if (!await getAdminApiUser()) return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  const code = normalizeCode((await context.params).code);

  try {
    const body = await readJsonBody<{ unitPriceCents?: number; deadline?: string; designApproved?: boolean }>(request, 32 * 1024);
    if ("response" in body) return body.response;
    const payload = body.data;
    await ensureQuoteSchema();
    const db = getDb();
    const [quote] = await db.select().from(quoteRequests).where(eq(quoteRequests.code, code)).limit(1);
    if (!quote) return Response.json({ error: "No existe ese presupuesto." }, { status: 404 });
    const [existing] = await db.select().from(groupOrders).where(eq(groupOrders.quoteId, quote.id)).limit(1);
    if (existing) return Response.json({ group: existing });

    let configuration: Record<string, string> = {};
    try { configuration = JSON.parse(quote.configurationJson) as Record<string, string>; } catch { configuration = {}; }
    const suggested = priceForQuantityCents(quote.quantity);
    const unitPriceCents = Number(payload.unitPriceCents || suggested || 0);
    if (!Number.isInteger(unitPriceCents) || unitPriceCents < 100 || unitPriceCents > 100000) {
      return Response.json({ error: "Define un precio unitario válido antes de aprobar." }, { status: 400 });
    }

    let group = null;
    for (let attempt = 0; attempt < 3 && !group; attempt += 1) {
      const accessCode = createAccessCode();
      const [collision] = await db.select({ id: groupOrders.id }).from(groupOrders).where(eq(groupOrders.accessCode, accessCode)).limit(1);
      if (collision) continue;
      [group] = await db.insert(groupOrders).values({
        quoteId: quote.id,
        accessCode,
        groupName: configuration.groupName || quote.groupType,
        organizerName: quote.organizerName,
        organizerEmail: quote.email,
        organizerPhone: quote.phone,
        productType: configuration.product === "Camiseta" ? "tshirt" : "hoodie",
        garment: configuration.model || "Gildan 18500",
        color: configuration.color || "Por confirmar",
        estimatedQuantity: quote.quantity,
        unitPriceCents,
        designStatus: payload.designApproved ? "approved" : "review",
        registrationStatus: "open",
        paymentStatus: "locked",
        productionStatus: "planning",
        deadline: String(payload.deadline || quote.desiredDate || "").slice(0, 80),
        configurationJson: quote.configurationJson,
      }).returning();
    }
    if (!group) throw new Error("Could not generate unique group code");
    const groupUrl = new URL(`/pedido/${group.accessCode}`, request.url).toString();
    const emailStatus = await sendOrganizerGroupEmail({ to: quote.email, organizerName: quote.organizerName, groupName: group.groupName, groupUrl });
    await db.update(quoteRequests).set({ status: "approved", emailStatus, updatedAt: new Date().toISOString() }).where(and(eq(quoteRequests.id, quote.id), eq(quoteRequests.code, code)));
    await trackServerProductEvent("grupo_created", { product_type: group.productType, quantity: group.estimatedQuantity });
    return Response.json({ group, emailStatus }, { status: 201 });
  } catch (error) {
    reportServerError(error, "admin");
    return Response.json({ error: "No hemos podido aprobar el presupuesto." }, { status: 500 });
  }
}
