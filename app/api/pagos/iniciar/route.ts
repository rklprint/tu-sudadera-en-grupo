import { ensureQuoteSchema } from "@/db";
import { trackServerProductEvent } from "@/lib/analytics";
import { createMerchantOrder, createRedsysProvider, getRedsysConfig } from "@/lib/payments/redsys";
import type { PaymentMethod } from "@/lib/payments/types";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import { readJsonBody, rejectCrossOriginMutation, rejectOversizedRequest, secureJson, takeRateLimit } from "@/lib/request-security";
import { reportServerError } from "@/lib/observability";
import { hashPrivateToken } from "@/lib/group-orders";

type PaymentRequest = { method?: PaymentMethod; scope?: "participant" | "remaining"; participantToken?: string; groupCode?: string };
type Actor = { groupId: number; participantId: number | null; amountCents: number };
type Database = NonNullable<ReturnType<typeof getSiteRuntimeEnv>["DB"]>;

export async function POST(request: Request) {
  const rejected = rejectCrossOriginMutation(request) || rejectOversizedRequest(request, 32 * 1024);
  if (rejected) return rejected;
  const limited = takeRateLimit(request, "payment_start", { limit: 15, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const idempotencyKey = String(request.headers.get("idempotency-key") || "").trim();
  if (!/^[a-zA-Z0-9_-]{20,100}$/.test(idempotencyKey)) return secureJson({ error: "Falta una clave de idempotencia válida." }, { status: 400 });

  try {
    const body = await readJsonBody<PaymentRequest>(request, 32 * 1024);
    if ("response" in body) return body.response;
    const payload = body.data;
    if (!payload.method || !["card", "bizum", "transfer"].includes(payload.method)) return secureJson({ error: "El método de pago no es válido." }, { status: 400 });
    if (payload.scope !== "participant" && payload.scope !== "remaining") return secureJson({ error: "El alcance del pago no es válido." }, { status: 400 });

    await ensureQuoteSchema();
    const { DB, BANK_TRANSFER_IBAN, BANK_TRANSFER_ACCOUNT_HOLDER, REDSYS_BIZUM_ENABLED } = getSiteRuntimeEnv();
    if (!DB) throw new Error("Database unavailable");
    const existing = await DB.prepare("SELECT reference, method, provider, merchant_order, amount_cents, status FROM payments WHERE idempotency_key = ?").bind(idempotencyKey).first<{ reference: string; method: string; provider: string; merchant_order: string | null; amount_cents: number; status: string }>();
    if (existing) return paymentResponse(request, existing, payload.method);

    const actor = payload.scope === "participant" ? await participantActor(DB, String(payload.participantToken || "")) : await remainingActor(DB, String(payload.groupCode || ""));
    if ("error" in actor) return secureJson({ error: actor.error }, { status: actor.status });
    if (actor.amountCents < 1) return secureJson({ error: "No queda ningún importe pendiente en este pedido." }, { status: 409 });
    const reference = `TSG-${crypto.randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`;
    const activeScopeKey = actor.participantId ? `participant:${actor.participantId}` : `group:${actor.groupId}:remaining`;
    const activePayment = await DB.prepare("SELECT reference FROM payments WHERE active_scope_key = ? AND status IN ('pending', 'processing')").bind(activeScopeKey).first<{ reference: string }>();
    if (activePayment) return secureJson({ error: "Ya hay un pago en curso para esta selección. Revisa su estado antes de iniciar otro." }, { status: 409 });

    if (payload.method === "transfer") {
      if (!BANK_TRANSFER_IBAN || !BANK_TRANSFER_ACCOUNT_HOLDER) return secureJson({ error: "La transferencia todavía no está configurada." }, { status: 503 });
      await DB.prepare(`INSERT INTO payments (group_id, participant_id, reference, method, provider, idempotency_key, active_scope_key, amount_cents, status, updated_at) VALUES (?, ?, ?, 'transfer', 'manual', ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`)
        .bind(actor.groupId, actor.participantId, reference, idempotencyKey, activeScopeKey, actor.amountCents).run();
      await trackServerProductEvent("bank_transfer_selected", { payment_method: "transfer", amount_bucket: amountBucket(actor.amountCents) });
      return secureJson({ kind: "transfer", reference, amountCents: actor.amountCents, status: "pending", instructions: { iban: BANK_TRANSFER_IBAN, accountHolder: BANK_TRANSFER_ACCOUNT_HOLDER, concept: reference } }, { status: 201 });
    }

    const config = getRedsysConfig();
    if (!config) return secureJson({ error: "El TPV Redsys todavía no está configurado." }, { status: 503 });
    if (payload.method === "bizum" && REDSYS_BIZUM_ENABLED !== "true") return secureJson({ error: "Bizum todavía no está activado por la entidad bancaria." }, { status: 503 });
    let merchantOrder = "";
    for (let attempt = 0; attempt < 4; attempt += 1) {
      merchantOrder = createMerchantOrder();
      try {
        await DB.prepare(`INSERT INTO payments (group_id, participant_id, reference, method, provider, merchant_order, idempotency_key, active_scope_key, amount_cents, status, updated_at) VALUES (?, ?, ?, ?, 'redsys', ?, ?, ?, ?, 'processing', CURRENT_TIMESTAMP)`)
          .bind(actor.groupId, actor.participantId, reference, payload.method, merchantOrder, idempotencyKey, activeScopeKey, actor.amountCents).run();
        break;
      } catch (error) {
        if (attempt === 3) throw error;
        merchantOrder = "";
      }
    }
    if (!merchantOrder) throw new Error("Could not create merchant order");
    await trackServerProductEvent("payment_started", { payment_method: payload.method, amount_bucket: amountBucket(actor.amountCents) });
    return paymentResponse(request, { reference, method: payload.method, provider: "redsys", merchant_order: merchantOrder, amount_cents: actor.amountCents, status: "processing" }, payload.method, 201);
  } catch (error) {
    if (/active_scope_key|active group payments|active remaining payment/i.test(String(error))) return secureJson({ error: "Ya hay pagos en curso incompatibles con esta operación. Revisa su estado antes de iniciar otro." }, { status: 409 });
    reportServerError(error, "payment_start");
    return secureJson({ error: "No hemos podido iniciar el pago. No se ha realizado ningún cargo." }, { status: 500 });
  }
}

async function participantActor(DB: Database, rawToken: string): Promise<Actor | { error: string; status: number }> {
  const token = rawToken.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const tokenHash = await hashPrivateToken(token);
  const participant = await DB.prepare(`SELECT p.id, p.group_id, p.payment_status, p.edit_token_expires_at, p.edit_token_revoked_at, g.private_link_revoked_at, g.payment_status AS group_payment_status, coalesce((SELECT sum(unit_price_cents + extras_cents) FROM order_items WHERE participant_id = p.id), 0) AS amount FROM participants p INNER JOIN group_orders g ON g.id = p.group_id WHERE p.edit_token_hash = ? OR p.edit_token = ?`).bind(tokenHash, token).first<{ id: number; group_id: number; payment_status: string; edit_token_expires_at: string; edit_token_revoked_at: string; private_link_revoked_at: string; group_payment_status: string; amount: number }>();
  if (!participant) return { error: "El enlace personal no es válido.", status: 404 };
  if (participant.edit_token_revoked_at || (participant.edit_token_expires_at && Date.parse(participant.edit_token_expires_at) <= Date.now())) return { error: "El enlace personal ha caducado o ha sido revocado.", status: 410 };
  if (participant.private_link_revoked_at) return { error: "El acceso privado de este grupo ha sido revocado.", status: 410 };
  if (participant.group_payment_status !== "open") return { error: "Los pagos de este grupo no están abiertos.", status: 409 };
  if (participant.payment_status === "paid") return { error: "Este participante ya tiene el pago confirmado.", status: 409 };
  const organizerPayment = await DB.prepare("SELECT id FROM payments WHERE group_id = ? AND participant_id IS NULL AND status IN ('pending', 'processing') LIMIT 1").bind(participant.group_id).first<{ id: number }>();
  if (organizerPayment) return { error: "El organizador ya tiene un pago restante en curso. Espera a que se resuelva antes de iniciar un pago individual.", status: 409 };
  return { groupId: participant.group_id, participantId: participant.id, amountCents: Number(participant.amount) };
}

async function remainingActor(DB: Database, rawCode: string): Promise<Actor | { error: string; status: number }> {
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
  const group = await DB.prepare(`SELECT g.id, g.payment_status, coalesce((SELECT sum(oi.unit_price_cents + oi.extras_cents) FROM order_items oi INNER JOIN participants p ON p.id = oi.participant_id WHERE p.group_id = g.id), 0) AS expected, coalesce((SELECT sum(amount_cents) FROM payments WHERE group_id = g.id AND status = 'confirmed'), 0) AS confirmed FROM group_orders g WHERE g.access_code = ? AND g.private_link_revoked_at = ''`).bind(code).first<{ id: number; payment_status: string; expected: number; confirmed: number }>();
  if (!group) return { error: "El enlace del grupo no es válido o ha sido revocado.", status: 404 };
  if (group.payment_status !== "open") return { error: "Los pagos de este grupo no están abiertos.", status: 409 };
  const activePayment = await DB.prepare("SELECT id FROM payments WHERE group_id = ? AND status IN ('pending', 'processing') LIMIT 1").bind(group.id).first<{ id: number }>();
  if (activePayment) return { error: "Hay pagos individuales o transferencias todavía en curso. Resuélvelos antes de pagar el resto del grupo.", status: 409 };
  return { groupId: group.id, participantId: null, amountCents: Math.max(0, Number(group.expected) - Number(group.confirmed)) };
}

async function paymentResponse(request: Request, payment: { reference: string; method: string; provider: string; merchant_order: string | null; amount_cents: number; status: string }, requestedMethod: PaymentMethod, status = 200) {
  if (payment.method !== requestedMethod) return secureJson({ error: "La clave de idempotencia ya se utilizó con otro método." }, { status: 409 });
  if (payment.provider === "manual") {
    const { BANK_TRANSFER_IBAN, BANK_TRANSFER_ACCOUNT_HOLDER } = getSiteRuntimeEnv();
    if (!BANK_TRANSFER_IBAN || !BANK_TRANSFER_ACCOUNT_HOLDER) return secureJson({ error: "La transferencia todavía no está configurada." }, { status: 503 });
    return secureJson({
      kind: "transfer",
      reference: payment.reference,
      amountCents: payment.amount_cents,
      status: payment.status,
      instructions: { iban: BANK_TRANSFER_IBAN, accountHolder: BANK_TRANSFER_ACCOUNT_HOLDER, concept: payment.reference },
    }, { status });
  }
  const config = getRedsysConfig();
  if (!config || !payment.merchant_order) return secureJson({ error: "El TPV Redsys todavía no está configurado." }, { status: 503 });
  const origin = new URL(request.url).origin;
  const form = await createRedsysProvider(config).createHostedPayment({ merchantOrder: payment.merchant_order, amountCents: payment.amount_cents, method: payment.method === "bizum" ? "bizum" : "card", notificationUrl: `${origin}/api/pagos/redsys/notificacion`, successUrl: `${origin}/pago/resultado?ref=${encodeURIComponent(payment.reference)}&estado=pendiente`, cancelUrl: `${origin}/pago/resultado?ref=${encodeURIComponent(payment.reference)}&estado=cancelado`, merchantData: payment.reference });
  return secureJson({ kind: "redsys", reference: payment.reference, amountCents: payment.amount_cents, status: payment.status, form }, { status });
}

function amountBucket(cents: number) {
  if (cents < 5_000) return "under_50";
  if (cents < 20_000) return "50_199";
  if (cents < 50_000) return "200_499";
  return "500_plus";
}
