import { eq, sql } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { groupOrders, orderItems, participants } from "@/db/schema";
import { getAdminApiUser } from "@/lib/admin-auth";
import { normalizeCode, priceForQuantityCents } from "@/lib/group-orders";
import { sendOrganizerStatusEmail } from "@/lib/order-emails";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import { getAppUrl } from "@/lib/app-origin";
import { readJsonBody, rejectCrossOriginMutation, rejectOversizedRequest } from "@/lib/request-security";
import {
  parseStoredQuoteConfiguration,
  priceFromCommercialSnapshot,
  readCommercialSnapshot,
} from "@/lib/commercial";

type RouteContext = { params: Promise<{ code: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const sizeError = rejectOversizedRequest(request, 32 * 1024);
  if (sizeError) return sizeError;
  const admin = await getAdminApiUser();
  if (!admin) return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  const code = normalizeCode((await context.params).code);

  try {
    const body = await readJsonBody<{ action?: string; unitPriceCents?: number; shippingAddress?: string; shippingRecipient?: string; shippingPostalCode?: string; shippingCity?: string; shippingProvince?: string; shippingCountry?: string; carrier?: string; trackingCode?: string }>(request, 32 * 1024);
    if ("response" in body) return body.response;
    const payload = body.data;
    await ensureQuoteSchema();
    const db = getDb();
    const { DB } = getSiteRuntimeEnv();
    if (!DB) throw new Error("Database unavailable");
    const [group] = await db.select().from(groupOrders).where(eq(groupOrders.accessCode, code)).limit(1);
    if (!group) return Response.json({ error: "No existe ese grupo." }, { status: 404 });

    const changes: Partial<typeof groupOrders.$inferInsert> = { updatedAt: new Date().toISOString() };
    if (payload.action === "close_registration") {
      const [result] = await db.select({ total: sql<number>`coalesce(sum(${orderItems.quantity}), 0)` }).from(orderItems).innerJoin(participants, eq(orderItems.participantId, participants.id)).where(eq(participants.groupId, group.id));
      const actualQuantity = Number(result?.total || 0);
      const configuration = parseStoredQuoteConfiguration(group.configurationJson);
      const commercialSnapshot = readCommercialSnapshot(configuration.commercialSnapshot);
      const recalculated = commercialSnapshot
        ? priceFromCommercialSnapshot(commercialSnapshot, actualQuantity)
        : priceForQuantityCents(actualQuantity);
      const manual = Number(payload.unitPriceCents || 0);
      if (actualQuantity < 1) return Response.json({ error: "No puedes cerrar un registro sin prendas." }, { status: 409 });
      if (!recalculated && (!Number.isInteger(manual) || manual < 100 || manual > 100000)) {
        return Response.json({ error: "Esta cantidad queda fuera de la tabla. Introduce primero el precio unitario acordado." }, { status: 409 });
      }
      changes.registrationStatus = "closed";
      changes.estimatedQuantity = actualQuantity;
      changes.unitPriceCents = recalculated || manual;
      changes.configurationJson = JSON.stringify({
        ...configuration,
        closedCommercial: {
          closedAt: new Date().toISOString(),
          actualQuantity,
          unitPriceCents: recalculated || manual,
          source: recalculated ? "approved_price_table" : "manual",
        },
      });
    } else if (payload.action === "reopen_registration") {
      if (group.paymentStatus !== "locked") return Response.json({ error: "No puede reabrirse después de abrir pagos." }, { status: 409 });
      changes.registrationStatus = "open";
    } else if (payload.action === "open_payment") {
      if (group.registrationStatus === "open") return Response.json({ error: "Cierra primero el registro con el organizador." }, { status: 409 });
      if (group.designStatus !== "approved") return Response.json({ error: "El diseño debe estar aprobado antes de abrir pagos." }, { status: 409 });
      const unresolved = await DB.prepare(`SELECT COUNT(*) AS total
        FROM order_items
        INNER JOIN participants ON order_items.participant_id = participants.id
        WHERE participants.group_id = ?
          AND (order_items.front_extra = 'custom_embroidery' OR order_items.sleeve_extra = 'custom_embroidery')
          AND order_items.extras_cents <= 0`).bind(group.id).first<{ total: number }>();
      if (Number(unresolved?.total || 0) > 0) {
        return Response.json({ error: "Hay bordados personalizados sin valorar. Define sus extras antes de abrir pagos." }, { status: 409 });
      }
      changes.paymentStatus = "open";
    } else if (payload.action === "set_price") {
      const manual = Number(payload.unitPriceCents || 0);
      if (!Number.isInteger(manual) || manual < 100 || manual > 100000) return Response.json({ error: "Introduce un precio unitario válido." }, { status: 400 });
      if (group.paymentStatus !== "locked") return Response.json({ error: "El precio no puede cambiarse después de abrir pagos." }, { status: 409 });
      changes.unitPriceCents = manual;
    } else if (payload.action === "complete_payment") {
      const totals = await DB.prepare(`SELECT
          coalesce((SELECT sum((oi.unit_price_cents + oi.extras_cents) * oi.quantity)
            FROM order_items oi
            INNER JOIN participants p ON p.id = oi.participant_id
            WHERE p.group_id = ?), 0) AS expected,
          coalesce((SELECT sum(amount_cents)
            FROM payments
            WHERE group_id = ? AND status = 'confirmed'), 0) AS confirmed`)
        .bind(group.id, group.id)
        .first<{ expected: number; confirmed: number }>();
      const expected = Number(totals?.expected || 0);
      const confirmed = Number(totals?.confirmed || 0);
      if (expected <= 0 || confirmed !== expected) {
        return Response.json({
          error: confirmed > expected
            ? "Los pagos confirmados superan el total del pedido. Revisa el descuadre antes de continuar."
            : `Todavía quedan ${((expected - confirmed) / 100).toFixed(2).replace(".", ",")} € por confirmar.`,
        }, { status: 409 });
      }
      changes.paymentStatus = "complete";
      changes.productionStatus = "queued";
    } else if (payload.action === "start_production") {
      if (group.paymentStatus !== "complete") return Response.json({ error: "El pago debe estar completo antes de producir." }, { status: 409 });
      changes.productionStatus = "in_production";
    } else if (payload.action === "mark_shipped") {
      if (group.productionStatus !== "in_production") return Response.json({ error: "El pedido todavía no figura en producción." }, { status: 409 });
      const carrier = clean(payload.carrier, 80);
      const trackingCode = clean(payload.trackingCode, 120);
      if (!carrier || !trackingCode) return Response.json({ error: "Indica transportista y código de seguimiento antes de marcar el envío." }, { status: 400 });
      changes.productionStatus = "shipped";
      changes.carrier = carrier;
      changes.trackingCode = trackingCode;
      changes.shippedAt = new Date().toISOString();
    } else if (payload.action === "mark_delivered") {
      if (group.productionStatus !== "shipped") return Response.json({ error: "El pedido debe figurar como enviado antes de marcarlo como entregado." }, { status: 409 });
      changes.productionStatus = "delivered";
      changes.deliveredAt = new Date().toISOString();
    } else if (payload.action === "set_shipping") {
      if (group.productionStatus === "delivered") return Response.json({ error: "No puede cambiarse la dirección de un pedido entregado." }, { status: 409 });
      const shippingAddress = clean(payload.shippingAddress, 220);
      const shippingRecipient = clean(payload.shippingRecipient, 100);
      const shippingPostalCode = clean(payload.shippingPostalCode, 12);
      const shippingCity = clean(payload.shippingCity, 90);
      const shippingProvince = clean(payload.shippingProvince, 90);
      const shippingCountry = clean(payload.shippingCountry, 70) || "España";
      if (!shippingAddress || !shippingRecipient || !shippingPostalCode || !shippingCity) return Response.json({ error: "Completa destinatario, dirección, código postal y localidad." }, { status: 400 });
      Object.assign(changes, { shippingAddress, shippingRecipient, shippingPostalCode, shippingCity, shippingProvince, shippingCountry });
    } else if (payload.action === "revoke_private_link") {
      changes.privateLinkRevokedAt = new Date().toISOString();
    } else {
      return Response.json({ error: "Acción no válida." }, { status: 400 });
    }

    const [updated] = await db.update(groupOrders).set(changes).where(eq(groupOrders.id, group.id)).returning();
    if (changes.unitPriceCents) {
      await DB.prepare("UPDATE order_items SET unit_price_cents = ?, updated_at = CURRENT_TIMESTAMP WHERE participant_id IN (SELECT id FROM participants WHERE group_id = ?)").bind(changes.unitPriceCents, group.id).run();
    }
    await DB.prepare("INSERT INTO audit_logs (actor, action, entity_type, entity_id, metadata_json) VALUES (?, ?, 'group', ?, ?)")
      .bind(admin.email, payload.action || "unknown", String(group.id), JSON.stringify({ changedFields: Object.keys(changes).filter((key) => key !== "updatedAt") }))
      .run();
    const notification = statusNotification(payload.action || "");
    const emailStatus = notification ? await sendOrganizerStatusEmail({
      to: updated.organizerEmail,
      organizerName: updated.organizerName,
      groupName: updated.groupName,
      groupUrl: getAppUrl(`/pedido/${updated.accessCode}`),
      ...notification,
    }) : "not_required";
    return Response.json({ group: updated, emailStatus });
  } catch {
    return Response.json({ error: "No hemos podido actualizar el grupo." }, { status: 500 });
  }
}

function clean(value: unknown, maxLength: number) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function statusNotification(action: string): { statusLabel: string; detail: string } | null {
  if (action === "close_registration") return { statusLabel: "Registro cerrado", detail: "La lista queda cerrada mientras revisamos juntos la cantidad real, el tramo y cualquier bordado a consultar." };
  if (action === "open_payment") return { statusLabel: "Pagos abiertos", detail: "El precio ya está fijado. El grupo puede combinar pagos individuales con un pago final del organizador." };
  if (action === "complete_payment") return { statusLabel: "Pago completo", detail: "El pedido está completamente pagado y ya puede pasar a producción." };
  if (action === "start_production") return { statusLabel: "Pedido en producción", detail: "Hemos iniciado la producción. El plazo habitual es de 10–15 días laborables." };
  if (action === "mark_shipped") return { statusLabel: "Pedido enviado", detail: "El envío conjunto ya está en camino. El seguimiento se facilitará únicamente al organizador." };
  if (action === "mark_delivered") return { statusLabel: "Pedido entregado", detail: "El pedido figura como entregado. Gracias por confiar en Tu Sudadera en Grupo." };
  return null;
}
