import { ensureQuoteSchema } from "@/db";
import { getRedsysConfig, verifyPaymentCancellationToken } from "@/lib/payments/redsys";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import {
  readJsonBody,
  rejectCrossOriginMutation,
  rejectOversizedRequest,
  secureJson,
  takeRateLimit,
} from "@/lib/request-security";

type RouteContext = { params: Promise<{ reference: string }> };

export async function POST(request: Request, context: RouteContext) {
  const rejected = rejectCrossOriginMutation(request) || rejectOversizedRequest(request, 8 * 1024);
  if (rejected) return rejected;
  const limited = takeRateLimit(request, "payment_cancel", { limit: 30, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const reference = decodeURIComponent((await context.params).reference)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 40);

  try {
    const body = await readJsonBody<{ token?: string }>(request, 8 * 1024);
    if ("response" in body) return body.response;
    const config = getRedsysConfig();
    if (!config || !await verifyPaymentCancellationToken(reference, String(body.data.token || ""), config.signingKey)) {
      return secureJson({ error: "La cancelación no es válida." }, { status: 403 });
    }

    await ensureQuoteSchema();
    const { DB } = getSiteRuntimeEnv();
    if (!DB) throw new Error("Database unavailable");
    const payment = await DB.prepare("SELECT id, provider, status FROM payments WHERE reference = ?")
      .bind(reference)
      .first<{ id: number; provider: string; status: string }>();
    if (!payment) return secureJson({ error: "No existe esa operación." }, { status: 404 });
    if (payment.provider !== "redsys") return secureJson({ error: "Esta operación no pertenece a Redsys." }, { status: 409 });
    if (payment.status === "confirmed") return secureJson({ status: "confirmed" }, { status: 409 });
    if (payment.status === "cancelled") return secureJson({ status: "cancelled", idempotent: true });

    const result = await DB.prepare("UPDATE payments SET status = 'cancelled', active_scope_key = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'processing'")
      .bind(payment.id)
      .run() as { meta?: { changes?: number } };
    const transitioned = Number(result.meta?.changes || 0) > 0;
    if (transitioned) {
      await DB.prepare("INSERT OR IGNORE INTO payment_events (payment_id, provider, event_key, event_type, payload_hash) VALUES (?, 'redsys', ?, 'payment_cancelled', '')")
        .bind(payment.id, `redsys-browser-cancel:${payment.id}`)
        .run();
      return secureJson({ status: "cancelled" });
    }

    const current = await DB.prepare("SELECT status FROM payments WHERE id = ?")
      .bind(payment.id)
      .first<{ status: string }>();
    return secureJson({ status: current?.status || payment.status }, { status: 409 });
  } catch {
    return secureJson({ error: "No hemos podido registrar la cancelación." }, { status: 500 });
  }
}
