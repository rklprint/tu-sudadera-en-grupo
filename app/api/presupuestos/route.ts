import { eq } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { quoteRequests } from "@/db/schema";
import { notifyQuoteRequest } from "@/lib/quote-email";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import { validateDesignFile } from "@/lib/design-files";
import {
  rejectCrossOriginMutation,
  rejectOversizedRequest,
  readBoundedBody,
  secureJson,
  takeRateLimit,
  verifyTurnstile,
} from "@/lib/request-security";
import { trackServerProductEvent } from "@/lib/analytics";
import { reportServerError } from "@/lib/observability";

const allowedGroupTypes = new Set([
  "Colegio o instituto",
  "Universidad o promoción",
  "Peña o fiestas",
  "Equipo o club",
  "Viaje o evento",
  "Grupo de amigos",
  "Otro",
]);

type QuoteInput = {
  organizerName?: string;
  phone?: string;
  email?: string;
  groupName?: string;
  groupType?: string;
  location?: string;
  quantity?: number;
  desiredDate?: string;
  notes?: string;
  referenceUrl?: string;
  configuration?: Record<string, string>;
  privacyAccepted?: boolean;
  website?: string;
  turnstileToken?: string;
};

const MAX_QUOTE_REQUEST_BYTES = 16 * 1024 * 1024;

function trim(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function createReference() {
  const date = new Date();
  const stamp = `${String(date.getUTCFullYear()).slice(-2)}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return `TSG-${stamp}-${random}`;
}

async function readPayload(request: Request): Promise<{ payload: QuoteInput; designFile: File | null }> {
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return { payload: await request.json() as QuoteInput, designFile: null };
  }

  const formData = await request.formData();
  let configuration: Record<string, string> = {};
  try {
    configuration = JSON.parse(String(formData.get("configuration") || "{}")) as Record<string, string>;
  } catch {
    configuration = {};
  }
  const rawFile = formData.get("designFile");
  return {
    payload: {
      organizerName: String(formData.get("organizerName") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      groupName: String(formData.get("groupName") || ""),
      groupType: String(formData.get("groupType") || ""),
      location: String(formData.get("location") || ""),
      quantity: Number(formData.get("quantity") || 0),
      desiredDate: String(formData.get("desiredDate") || ""),
      notes: String(formData.get("notes") || ""),
      referenceUrl: String(formData.get("referenceUrl") || ""),
      configuration,
      privacyAccepted: String(formData.get("privacyAccepted")) === "true",
      website: String(formData.get("website") || ""),
      turnstileToken: String(formData.get("cf-turnstile-response") || formData.get("turnstileToken") || ""),
    },
    designFile: rawFile instanceof File && rawFile.size > 0 ? rawFile : null,
  };
}

export async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const sizeError = rejectOversizedRequest(request, MAX_QUOTE_REQUEST_BYTES);
  if (sizeError) return sizeError;
  const rateLimitError = takeRateLimit(request, "quote", { limit: 5, windowMs: 10 * 60_000 });
  if (rateLimitError) return rateLimitError;
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.includes("multipart/form-data") && !contentType.includes("application/json")) {
    return secureJson({ error: "El contenido de la solicitud no es válido." }, { status: 415 });
  }

  try {
    const bounded = await readBoundedBody(request, MAX_QUOTE_REQUEST_BYTES);
    if ("response" in bounded) return bounded.response;
    const parseRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: bounded.bytes.slice().buffer,
    });
    const { payload, designFile } = await readPayload(parseRequest);

    if (payload.website) {
      return secureJson({ error: "No se pudo procesar la solicitud." }, { status: 400 });
    }

    const turnstile = await verifyTurnstile(request, trim(payload.turnstileToken, 2_048), "quote_request");
    if (!turnstile.ok) {
      return secureJson({ error: "No hemos podido verificar que la solicitud sea legítima. Recarga la página e inténtalo otra vez." }, { status: 400 });
    }

    const organizerName = trim(payload.organizerName, 80);
    const phone = trim(payload.phone, 24);
    const email = trim(payload.email, 120);
    const groupName = trim(payload.groupName, 90);
    const requestedGroupType = trim(payload.groupType, 60);
    const groupType = allowedGroupTypes.has(requestedGroupType) ? requestedGroupType : "Otro";
    const location = trim(payload.location, 90) || "Por confirmar";
    const desiredDate = trim(payload.desiredDate, 20);
    const notes = trim(payload.notes, 1200);
    const referenceUrl = trim(payload.referenceUrl, 500);
    const quantity = Number(payload.quantity);

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (organizerName.length < 2 || phone.replace(/\D/g, "").length < 9 || groupName.length < 2 || !emailIsValid || !Number.isInteger(quantity) || quantity < 5 || quantity > 500 || !payload.privacyAccepted) {
      return secureJson({ error: "Revisa los campos obligatorios antes de enviar." }, { status: 400 });
    }

    const configuration = Object.fromEntries(
      Object.entries(payload.configuration || {})
        .slice(0, 20)
        .map(([key, value]) => [trim(key, 40), trim(value, 160)]),
    );
    configuration.groupName = groupName;
    await ensureQuoteSchema();
    const db = getDb();
    let code = createReference();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const existing = await db.select({ id: quoteRequests.id }).from(quoteRequests).where(eq(quoteRequests.code, code)).limit(1);
      if (!existing.length) break;
      code = createReference();
    }

    let designFileKey = "";
    if (designFile) {
      const validation = await validateDesignFile(designFile);
      if ("error" in validation) return secureJson({ error: validation.error }, { status: validation.status });
      const validatedFile = validation.file;
      const { BUCKET } = getSiteRuntimeEnv();
      if (!BUCKET) return secureJson({ error: "La subida de archivos todavía no está disponible." }, { status: 503 });
      designFileKey = `quote-designs/${code}/${crypto.randomUUID()}-${validatedFile.safeName}`;
      await BUCKET.put(designFileKey, validatedFile.bytes, {
        httpMetadata: { contentType: validatedFile.contentType },
        customMetadata: { originalName: validatedFile.safeName, quoteCode: code },
      });
      configuration.designFileKey = designFileKey;
      configuration.designFileName = validatedFile.safeName;
      configuration.designFileType = validatedFile.contentType;
      configuration.designFileSize = String(designFile.size);
    }

    try {
      await db.insert(quoteRequests).values({
        code,
        organizerName,
        phone,
        email,
        groupType,
        location,
        quantity,
        desiredDate,
        notes,
        referenceUrl,
        configurationJson: JSON.stringify(configuration),
      });
    } catch (insertError) {
      if (designFileKey) await getSiteRuntimeEnv().BUCKET?.delete(designFileKey).catch(() => undefined);
      throw insertError;
    }

    const origin = new URL(request.url).origin;
    const emailStatus = await notifyQuoteRequest({
      code,
      organizerName,
      phone,
      email,
      groupType,
      location,
      quantity,
      desiredDate,
      notes,
      referenceUrl,
      configuration,
      statusUrl: `${origin}/pedido/${encodeURIComponent(code)}`,
    });

    if (emailStatus !== "pending") {
      await db.update(quoteRequests).set({ emailStatus }).where(eq(quoteRequests.code, code));
    }
    await trackServerProductEvent("presupuesto_submitted", { product_type: configuration.product === "Camiseta" ? "tshirt" : "hoodie", quantity, group_type: groupType });

    return secureJson({ code, status: "received", emailStatus }, { status: 201 });
  } catch (error) {
    reportServerError(error, "quote");
    const message = error instanceof Error ? error.message : "Error inesperado";
    const isMissingTable = message.includes("no such table") || message.includes("quote_requests");
    return secureJson(
      { error: isMissingTable ? "El registro de solicitudes todavía se está preparando." : "No hemos podido registrar la solicitud. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
