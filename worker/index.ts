/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { setSiteRuntimeEnv, type D1Binding, type SiteRuntimeEnv } from "../lib/runtime-env";

interface Env extends SiteRuntimeEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response> | Response;
  };
  DB: D1Binding;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    setSiteRuntimeEnv(env);
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const imageResponse = await handleImageOptimization(request, {
        fetchAsset: (path) => Promise.resolve(env.ASSETS.fetch(new Request(new URL(path, request.url)))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withSecurityHeaders(imageResponse, url, env.APP_ENV);
    }

    const response = await handler.fetch(request, env, ctx);
    return withSecurityHeaders(response, url, env.APP_ENV);
  },
};

const PRIVATE_PATH_PREFIXES = ["/api/", "/admin", "/pedido", "/participante", "/pago"];

function withSecurityHeaders(response: Response, url: URL, appEnv?: string): Response {
  const secured = new Response(response.body, response);
  const headers = secured.headers;
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self' https://sis-t.redsys.es:25443 https://sis.redsys.es",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "connect-src 'self' https://challenges.cloudflare.com https://*.i.posthog.com https://*.ingest.sentry.io",
      "frame-src https://challenges.cloudflare.com https://sis-t.redsys.es:25443 https://sis.redsys.es",
      "upgrade-insecure-requests",
    ].join("; "),
  );

  if (url.protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  if (PRIVATE_PATH_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(prefix))) {
    headers.set("Cache-Control", "private, no-store, max-age=0");
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, noimageindex");
  }

  if (appEnv && appEnv !== "production") {
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, noimageindex");
  }

  return secured;
}

export default worker;
