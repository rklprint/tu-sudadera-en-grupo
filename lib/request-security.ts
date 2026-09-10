import { getSiteRuntimeEnv } from "@/lib/runtime-env";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitEntry>();
const MAX_RATE_LIMIT_KEYS = 5_000;

export function rejectCrossOriginMutation(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  try {
    if (new URL(origin).origin === new URL(request.url).origin) return null;
  } catch {
    // Invalid origins are rejected below.
  }

  return secureJson({ error: "Origen de solicitud no permitido." }, { status: 403 });
}

export function rejectOversizedRequest(request: Request, maxBytes: number): Response | null {
  const rawLength = request.headers.get("content-length");
  if (!rawLength) return null;
  const contentLength = Number(rawLength);
  if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > maxBytes) {
    return secureJson({ error: "La solicitud supera el tamaño permitido." }, { status: 413 });
  }
  return null;
}

export async function readJsonBody<T>(request: Request, maxBytes: number): Promise<{ data: T } | { response: Response }> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return { response: secureJson({ error: "El contenido de la solicitud no es válido." }, { status: 415 }) };
  }
  const bounded = await readBoundedBody(request, maxBytes);
  if ("response" in bounded) return bounded;
  try {
    return { data: JSON.parse(new TextDecoder().decode(bounded.bytes)) as T };
  } catch {
    return { response: secureJson({ error: "El contenido JSON no es válido." }, { status: 400 }) };
  }
}

export async function readBoundedBody(request: Request, maxBytes: number): Promise<{ bytes: Uint8Array } | { response: Response }> {
  const declaredError = rejectOversizedRequest(request, maxBytes);
  if (declaredError) return { response: declaredError };
  if (!request.body) return { bytes: new Uint8Array() };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel("request too large").catch(() => undefined);
      return { response: secureJson({ error: "La solicitud supera el tamaño permitido." }, { status: 413 }) };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { bytes };
}

export function takeRateLimit(
  request: Request,
  scope: string,
  { limit, windowMs }: RateLimitOptions,
): Response | null {
  const now = Date.now();
  if (rateLimits.size > MAX_RATE_LIMIT_KEYS) {
    for (const [key, value] of rateLimits) {
      if (value.resetAt <= now) rateLimits.delete(key);
    }
  }

  const client = clientAddress(request);
  const key = `${scope}:${client}`;
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1_000));
    return secureJson(
      { error: "Has realizado demasiados intentos. Espera unos minutos y vuelve a probar." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  current.count += 1;
  return null;
}

export async function verifyTurnstile(
  request: Request,
  token: string,
  expectedAction: string,
): Promise<{ ok: boolean; configured: boolean }> {
  const secret = getSiteRuntimeEnv().TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, configured: false };
  if (!token || token.length > 2_048) return { ok: false, configured: true };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: clientAddress(request),
        idempotency_key: crypto.randomUUID(),
      }),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, configured: true };
    const result = await response.json() as {
      success?: boolean;
      action?: string;
      hostname?: string;
    };
    const requestHost = new URL(request.url).hostname;
    const actionMatches = !result.action || result.action === expectedAction;
    const hostMatches = !result.hostname || result.hostname === requestHost;
    return { ok: result.success === true && actionMatches && hostMatches, configured: true };
  } catch {
    return { ok: false, configured: true };
  } finally {
    clearTimeout(timeout);
  }
}

export function secureJson(
  value: unknown,
  init: ResponseInit = {},
): Response {
  const response = Response.json(value, init);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, noimageindex");
  return response;
}

function clientAddress(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  ).slice(0, 64);
}
