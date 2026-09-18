import { eq } from "drizzle-orm";
import { ensureQuoteSchema, getDb } from "@/db";
import { quoteRequests } from "@/db/schema";
import { getAdminApiUser } from "@/lib/admin-auth";
import { normalizeCode } from "@/lib/group-orders";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!await getAdminApiUser()) return Response.json({ error: "Acceso no autorizado." }, { status: 403 });
  const code = normalizeCode((await context.params).code);

  try {
    await ensureQuoteSchema();
    const db = getDb();
    const [quote] = await db.select({ configurationJson: quoteRequests.configurationJson }).from(quoteRequests).where(eq(quoteRequests.code, code)).limit(1);
    if (!quote) return Response.json({ error: "No existe ese presupuesto." }, { status: 404 });

    let configuration: Record<string, string> = {};
    try { configuration = JSON.parse(quote.configurationJson) as Record<string, string>; } catch { configuration = {}; }
    const key = String(configuration.designFileKey || "");
    if (!key.startsWith(`quote-designs/${code}/`)) return Response.json({ error: "Este presupuesto no tiene un diseño adjunto." }, { status: 404 });

    const { BUCKET } = getSiteRuntimeEnv();
    if (!BUCKET) return Response.json({ error: "El almacenamiento no está disponible." }, { status: 503 });
    const object = await BUCKET.get(key);
    if (!object) return Response.json({ error: "No encontramos el archivo adjunto." }, { status: 404 });

    const originalName = String(object.customMetadata?.originalName || configuration.designFileName || "diseno-adjunto");
    const encodedName = encodeURIComponent(originalName).replaceAll("'", "%27");
    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || configuration.designFileType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="diseno-adjunto"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "No hemos podido descargar el archivo." }, { status: 500 });
  }
}
