import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
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
  },
];
const nonProductionHeaders = process.env.APP_ENV && process.env.APP_ENV !== "production"
  ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, noimageindex" }]
  : [];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, ...nonProductionHeaders],
      },
      {
        source: "/(api|admin|pedido|participante|pago)/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, noimageindex" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/sudaderas-para-grupos", destination: "/sudaderas-personalizadas", permanent: true },
      { source: "/sudaderas-para-colegios", destination: "/sudaderas-colegios-institutos", permanent: true },
      { source: "/camisetas-para-grupos", destination: "/camisetas-personalizadas", permanent: true },
    ];
  },
};

export default nextConfig;
