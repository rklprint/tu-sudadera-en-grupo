export const PRODUCT_EVENTS = [
  "homepage_viewed",
  "personalizador_started",
  "producto_selected",
  "color_selected",
  "talla_selected",
  "personalizacion_added",
  "archivo_uploaded",
  "personalizador_completed",
  "presupuesto_started",
  "presupuesto_submitted",
  "grupo_created",
  "grupo_private_page_viewed",
  "participant_started",
  "participant_registered",
  "participant_edited",
  "checkout_started",
  "payment_method_selected",
  "payment_started",
  "payment_completed",
  "payment_failed",
  "bank_transfer_selected",
  "order_completed",
  "contact_whatsapp_clicked",
  "contact_email_clicked",
] as const;

export type ProductEvent = (typeof PRODUCT_EVENTS)[number];
type SafeValue = string | number | boolean;
type SafeProperties = Record<string, SafeValue | null | undefined>;

const ALLOWED_PROPERTIES = new Set([
  "product_type",
  "product_slug",
  "model",
  "color",
  "size",
  "quantity",
  "placement",
  "technique",
  "extra_type",
  "design_path",
  "group_type",
  "payment_method",
  "payment_status",
  "amount_bucket",
  "source",
  "step",
  "environment",
]);

function sanitizedProperties(properties: SafeProperties = {}) {
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) =>
        ALLOWED_PROPERTIES.has(key) &&
        value !== null &&
        value !== undefined &&
        ["string", "number", "boolean"].includes(typeof value),
    ),
  ) as Record<string, SafeValue>;
}

/**
 * Captures an anonymous, allowlisted product event in the browser. Names,
 * emails, phone numbers, private tokens and design content are discarded by
 * construction and must never be added to ALLOWED_PROPERTIES.
 */
export async function trackProductEvent(event: ProductEvent, properties: SafeProperties = {}) {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  const { default: posthog } = await import("posthog-js");
  posthog.capture(event, sanitizedProperties(properties));
}

/** Server-side capture for lifecycle events that do not depend on a browser. */
export async function trackServerProductEvent(event: ProductEvent, properties: SafeProperties = {}) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com").replace(/\/$/, "");
  if (!key) return;

  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: "tsg-server",
        properties: { ...sanitizedProperties(properties), $process_person_profile: false },
      }),
    });
  } catch {
    // Analytics must never block a quote, registration or payment operation.
  }
}
