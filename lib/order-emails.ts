import { getSiteRuntimeEnv } from "@/lib/runtime-env";

type EmailStatus = "sent" | "not_configured" | "failed";

export async function sendOrganizerGroupEmail(payload: { to: string; organizerName: string; groupName: string; groupUrl: string }): Promise<EmailStatus> {
  return sendEmail({
    idempotencyKey: `group-created:${payload.groupUrl}`,
    to: payload.to,
    subject: `${payload.groupName}: enlace privado abierto`,
    heading: "El grupo ya está abierto",
    intro: `Hola ${payload.organizerName}, hemos aprobado la propuesta de ${payload.groupName}.`,
    body: "Comparte el enlace con el grupo para que cada persona registre sus prendas. En esta primera fase no se realiza ningún pago.",
    actionLabel: "Abrir el grupo",
    actionUrl: payload.groupUrl,
    note: "Cuando la lista esté completa, cerraremos juntos la cantidad real y fijaremos el precio antes de abrir pagos.",
  });
}

export async function sendOrganizerStatusEmail(payload: { to: string; organizerName: string; groupName: string; groupUrl: string; statusLabel: string; detail: string }): Promise<EmailStatus> {
  return sendEmail({
    idempotencyKey: `group-status:${payload.groupUrl}:${payload.statusLabel}`,
    to: payload.to,
    subject: `${payload.groupName}: ${payload.statusLabel}`,
    heading: payload.statusLabel,
    intro: `Hola ${payload.organizerName}, el estado de ${payload.groupName} ha cambiado.`,
    body: payload.detail,
    actionLabel: "Consultar el pedido",
    actionUrl: payload.groupUrl,
    note: "El enlace muestra siempre el estado y los totales generales actualizados.",
  });
}

export async function sendPaymentReceiptEmail(payload: { to: string; contactName: string; groupName: string; reference: string; amountCents: number; orderUrl: string }): Promise<EmailStatus> {
  return sendEmail({
    idempotencyKey: `payment-receipt:${payload.reference}`,
    to: payload.to,
    subject: `Justificante de pago · ${payload.reference}`,
    heading: "Pago confirmado",
    intro: `Hola ${payload.contactName}, hemos confirmado tu pago para ${payload.groupName}.`,
    body: `Importe recibido: ${(payload.amountCents / 100).toFixed(2).replace(".", ",")} €. Referencia: ${payload.reference}.`,
    actionLabel: "Ver el pedido del grupo",
    actionUrl: payload.orderUrl,
    note: "Este correo es un justificante de pago. Si necesitas factura, solicita los datos fiscales por correo o WhatsApp.",
  });
}

async function sendEmail(payload: { idempotencyKey: string; to: string; subject: string; heading: string; intro: string; body: string; actionLabel: string; actionUrl: string; note: string }): Promise<EmailStatus> {
  const { RESEND_API_KEY, QUOTE_FROM_EMAIL } = getSiteRuntimeEnv();
  if (!RESEND_API_KEY) return "not_configured";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": payload.idempotencyKey },
      body: JSON.stringify({
        from: QUOTE_FROM_EMAIL || "Tu Sudadera en Grupo <web@tusudaderaengrupo.es>",
        to: [payload.to],
        subject: payload.subject,
        html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0b1830"><div style="padding:30px;background:#0b1830;color:white"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9ed8f4">Tu Sudadera en Grupo</div><h1 style="margin:12px 0 0;font-size:30px">${escapeHtml(payload.heading)}</h1></div><div style="padding:30px;background:#fff"><p>${escapeHtml(payload.intro)}</p><p>${escapeHtml(payload.body)}</p><a href="${escapeHtml(payload.actionUrl)}" style="display:inline-block;margin-top:12px;padding:14px 20px;border-radius:999px;background:#0b1830;color:#fff;text-decoration:none;font-weight:700">${escapeHtml(payload.actionLabel)}</a><p style="margin-top:25px;color:#66758a;font-size:13px">${escapeHtml(payload.note)}</p></div></div>`,
        text: `${payload.heading}\n\n${payload.intro}\n\n${payload.body}\n\n${payload.actionLabel}: ${payload.actionUrl}\n\n${payload.note}`,
      }),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}
