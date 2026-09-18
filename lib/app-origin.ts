import { getSiteRuntimeEnv } from "@/lib/runtime-env";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * The canonical application origin is server configuration, never a value
 * supplied by the browser. APP_ALLOWED_ORIGINS only controls which known
 * aliases may call a server; generated links and Redsys callbacks always use
 * APP_ORIGIN.
 */
export function getConfiguredAppOrigin(options: { requireHttps?: boolean } = {}): string {
  const rawOrigin = String(getSiteRuntimeEnv().APP_ORIGIN || "").trim();
  if (!rawOrigin) throw new Error("APP_ORIGIN is not configured");

  const url = parseOrigin(rawOrigin);
  const environment = String(getSiteRuntimeEnv().APP_ENV || "development").toLowerCase();
  const requireHttps = options.requireHttps === true;
  const isLocalDevelopment = (environment === "development" || environment === "test") && LOCAL_HOSTNAMES.has(url.hostname);

  if (requireHttps && url.protocol !== "https:") {
    throw new Error("APP_ORIGIN must use HTTPS for payment callbacks");
  }
  if (environment !== "development" && environment !== "test" && url.protocol !== "https:") {
    throw new Error("APP_ORIGIN must use HTTPS outside development and test");
  }
  if (url.protocol !== "https:" && !isLocalDevelopment) {
    throw new Error("Non-HTTPS APP_ORIGIN is only allowed for local development/test");
  }

  return url.origin;
}

/**
 * Reject direct requests made through an unconfigured Host/URL alias. The
 * request URL is only checked against server configuration; it is never used
 * to construct a callback or return URL.
 */
export function isAllowedAppRequestOrigin(request: Request): boolean {
  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    return false;
  }

  const configured = getConfiguredAppOrigin();
  const aliases = String(getSiteRuntimeEnv().APP_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => parseOrigin(value).origin);

  return new Set([configured, ...aliases]).has(requestOrigin);
}

export function getRedsysReturnUrls(reference: string, cancellationToken: string) {
  const origin = getConfiguredAppOrigin({ requireHttps: true });
  const encodedReference = encodeURIComponent(reference);
  return {
    notificationUrl: `${origin}/api/pagos/redsys/notificacion`,
    successUrl: `${origin}/pago/resultado?ref=${encodedReference}&estado=pendiente`,
    cancelUrl: `${origin}/pago/resultado?ref=${encodedReference}&estado=cancelado&token=${encodeURIComponent(cancellationToken)}`,
  };
}

export function getAppUrl(pathname: string): string {
  const origin = getConfiguredAppOrigin();
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(path, `${origin}/`).toString();
}

function parseOrigin(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("APP_ORIGIN must be an absolute URL");
  }

  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("APP_ORIGIN must be an origin without credentials, path, query or hash");
  }
  return url;
}
