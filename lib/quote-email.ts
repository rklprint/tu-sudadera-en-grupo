import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import type { StoredQuoteConfiguration } from "@/lib/commercial";

type QuoteEmailPayload = {
  code: string;
  organizerName: string;
  phone: string;
  email: string;
  groupType: string;
  location: string;
  quantity: number;
  desiredDate: string;
  notes: string;
  referenceUrl: string;
  configuration: StoredQuoteConfiguration;
  statusUrl: string;
};

type EmailResult = "sent" | "pending" | "failed";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clean(value: string | undefined) {
  return value?.trim() || "—";
}

export async function notifyQuoteRequest(payload: QuoteEmailPayload): Promise<EmailResult> {
  const runtimeEnv = getSiteRuntimeEnv();
  const apiKey = runtimeEnv.RESEND_API_KEY;

  if (!apiKey) {
    return "pending";
  }

  const rows = [
    ["Organizador", payload.organizerName],
    ["WhatsApp", payload.phone],
    ["Email", clean(payload.email)],
    ["Nombre del grupo", clean(payload.configuration.groupName)],
    ["Tipo de grupo", payload.groupType],
    ["Localidad", payload.location],
    ["Cantidad aproximada", String(payload.quantity)],
    ["Fecha deseada", clean(payload.desiredDate)],
    ["Producto", clean(payload.configuration.product)],
    ["Modelo", clean(payload.configuration.model)],
    ["Color", clean(payload.configuration.color)],
    ["Espalda", clean(payload.configuration.backDesign)],
    ["Delantera", clean(payload.configuration.frontDesign)],
    ["Manga", clean(payload.configuration.sleeve)],
    ["Diseño adjunto", clean(String(payload.configuration.designFileName || ""))],
    ["Precio base mostrado", clean(payload.configuration.basePrice)],
    ["Precio configurado mostrado", clean(payload.configuration.configuredPrice)],
    ["Notas", clean(payload.notes)],
    ["Referencias", clean(payload.referenceUrl)],
  ];

  const htmlRows = rows
    .map(([label, value]) => `<tr><td style="padding:9px 12px;color:#66758a;border-bottom:1px solid #e6e9ee">${escapeHtml(label)}</td><td style="padding:9px 12px;font-weight:700;border-bottom:1px solid #e6e9ee">${escapeHtml(value)}</td></tr>`)
    .join("");

  const text = [
    `Nueva solicitud ${payload.code}`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Abrir solicitud: ${payload.statusUrl}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `quote:${payload.code}:internal`,
      },
      body: JSON.stringify({
        from: runtimeEnv.QUOTE_FROM_EMAIL || "Tu Sudadera en Grupo <web@tusudaderaengrupo.es>",
        to: [runtimeEnv.QUOTE_TO_EMAIL || "pedidos@tusudaderaengrupo.es"],
        reply_to: payload.email || undefined,
        subject: `Nueva solicitud ${payload.code} · ${payload.configuration.groupName || payload.groupType} · ${payload.quantity} sudaderas`,
        html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#0b1830"><div style="padding:28px;background:#0b1830;color:white"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9ed8f4">Tu Sudadera en Grupo</div><h1 style="margin:10px 0 0;font-size:28px">Nueva solicitud ${escapeHtml(payload.code)}</h1></div><table style="width:100%;border-collapse:collapse;background:#fff">${htmlRows}</table><div style="padding:24px;background:#f4f0e7"><a href="${escapeHtml(payload.statusUrl)}" style="display:inline-block;padding:13px 18px;border-radius:999px;background:#0b1830;color:#fff;text-decoration:none;font-weight:700">Abrir solicitud</a></div></div>`,
        text,
      }),
    });

    if (!response.ok) return "failed";

    const customerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `quote:${payload.code}:customer`,
      },
      body: JSON.stringify({
        from: runtimeEnv.QUOTE_FROM_EMAIL || "Tu Sudadera en Grupo <web@tusudaderaengrupo.es>",
        to: [payload.email],
        reply_to: runtimeEnv.QUOTE_TO_EMAIL || "pedidos@tusudaderaengrupo.es",
        subject: `Hemos recibido vuestra idea · ${payload.code}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0b1830"><div style="padding:30px;background:#0b1830;color:white"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9ed8f4">Tu Sudadera en Grupo</div><h1 style="margin:12px 0 0;font-size:30px">Idea recibida</h1></div><div style="padding:30px;background:#fff"><p>Hola ${escapeHtml(payload.organizerName)},</p><p>Ya tenemos la solicitud de <strong>${escapeHtml(payload.configuration.groupName || payload.groupType)}</strong>. La revisaremos y os responderemos personalmente en menos de 24 horas laborables.</p><div style="margin:24px 0;padding:18px;background:#f4f0e7"><div style="font-size:11px;color:#66758a;text-transform:uppercase">Referencia</div><div style="margin-top:6px;font-size:22px;font-weight:800">${escapeHtml(payload.code)}</div></div><p style="color:#66758a">Todavía no se ha abierto ningún pago. Primero cerraremos diseño, cantidad y precio con el organizador.</p><a href="${escapeHtml(payload.statusUrl)}" style="display:inline-block;margin-top:10px;padding:13px 18px;border-radius:999px;background:#0b1830;color:#fff;text-decoration:none;font-weight:700">Consultar solicitud</a></div></div>`,
        text: `Hola ${payload.organizerName},\n\nHemos recibido la solicitud de ${payload.configuration.groupName || payload.groupType}. Referencia: ${payload.code}. Os responderemos en menos de 24 horas laborables.\n\nConsultar solicitud: ${payload.statusUrl}`,
      }),
    });

    return customerResponse.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
