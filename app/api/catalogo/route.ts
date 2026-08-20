import { readCatalog } from "@/lib/catalog-store";
import { takeRateLimit } from "@/lib/request-security";

export async function GET(request: Request) {
  const limited = takeRateLimit(request, "catalog_read", { limit: 120, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const products = await readCatalog(false);
    return Response.json({ products }, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "El catálogo no está disponible temporalmente." }, { status: 503 });
  }
}
