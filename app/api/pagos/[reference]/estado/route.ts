import { ensureQuoteSchema } from "@/db";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import { secureJson, takeRateLimit } from "@/lib/request-security";

type RouteContext = { params: Promise<{ reference: string }> };

export async function GET(request: Request, context: RouteContext) {
  const limited = takeRateLimit(request, "payment_status", { limit: 60, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const reference = decodeURIComponent((await context.params).reference).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
  try {
    await ensureQuoteSchema();
    const { DB } = getSiteRuntimeEnv();
    if (!DB) throw new Error("Database unavailable");
    const payment = await DB.prepare("SELECT reference, method, amount_cents, status, validated_at FROM payments WHERE reference = ?").bind(reference).first<{ reference: string; method: string; amount_cents: number; status: string; validated_at: string }>();
    if (!payment) return secureJson({ error: "No existe esa operación." }, { status: 404 });
    return secureJson({ reference: payment.reference, method: payment.method, amountCents: payment.amount_cents, status: payment.status, confirmedAt: payment.status === "confirmed" ? payment.validated_at : "" });
  } catch {
    return secureJson({ error: "No hemos podido consultar el pago." }, { status: 500 });
  }
}
