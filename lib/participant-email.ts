import { getSiteRuntimeEnv } from "@/lib/runtime-env";

type EditEmail = { to: string; contactName: string; groupName: string; editUrl: string };

export async function sendParticipantEditEmail(payload: EditEmail): Promise<"sent" | "not_configured" | "failed"> {
  const { RESEND_API_KEY, QUOTE_FROM_EMAIL } = getSiteRuntimeEnv();
  if (!RESEND_API_KEY) return "not_configured";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `participant-edit:${payload.editUrl}:${payload.to}` },
      body: JSON.stringify({
        from: QUOTE_FROM_EMAIL || "Tu Sudadera en Grupo <web@tusudaderaengrupo.es>",
        to: [payload.to],
        subject: `Tu selección para ${payload.groupName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0b1830"><div style="padding:30px;background:#0b1830;color:white"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9ed8f4">Tu Sudadera en Grupo</div><h1 style="margin:12px 0 0;font-size:30px">Registro guardado</h1></div><div style="padding:30px;background:#fff"><p>Hola ${escapeHtml(payload.contactName)},</p><p>Hemos guardado tus prendas para <strong>${escapeHtml(payload.groupName)}</strong>. Puedes corregir tallas, nombres y extras desde tu enlace privado mientras el registro siga abierto y antes de pagar.</p><a href="${escapeHtml(payload.editUrl)}" style="display:inline-block;margin-top:12px;padding:14px 20px;border-radius:999px;background:#0b1830;color:#fff;text-decoration:none;font-weight:700">Revisar o editar mis prendas</a><p style="margin-top:25px;color:#66758a;font-size:13px">No reenvíes este enlace: permite modificar tu selección.</p></div></div>`,
        text: `Hola ${payload.contactName},\n\nTu registro para ${payload.groupName} está guardado. Puedes revisarlo o editarlo aquí mientras el registro siga abierto y antes de pagar:\n\n${payload.editUrl}`,
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
