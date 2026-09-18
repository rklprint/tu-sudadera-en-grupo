import * as Sentry from "@sentry/nextjs";

const ALLOWED_AREAS = new Set(["quote", "registration", "participant", "catalog", "admin", "payment_start", "payment_callback", "email", "group"]);

export function reportServerError(error: unknown, area: string) {
  const normalized = error instanceof Error ? error : new Error("Unknown server error");
  Sentry.captureException(normalized, { tags: { area: ALLOWED_AREAS.has(area) ? area : "server" } });
}
