import { createCatalogProduct, readCatalog, updateCatalogProduct, validateCatalogProduct } from "@/lib/catalog-store";
import { getAdminApiUser } from "@/lib/admin-auth";
import { readJsonBody, rejectCrossOriginMutation, rejectOversizedRequest, secureJson, takeRateLimit } from "@/lib/request-security";

export async function GET(request: Request) {
  if (!await getAdminApiUser()) return secureJson({ error: "Acceso no autorizado." }, { status: 403 });
  const limited = takeRateLimit(request, "admin_catalog_read", { limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  try {
    return secureJson({ products: await readCatalog(true) });
  } catch {
    return secureJson({ error: "No hemos podido cargar el catálogo." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rejected = rejectCrossOriginMutation(request) || rejectOversizedRequest(request, 64 * 1024);
  if (rejected) return rejected;
  if (!await getAdminApiUser()) return secureJson({ error: "Acceso no autorizado." }, { status: 403 });
  const limited = takeRateLimit(request, "admin_catalog_write", { limit: 30, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const body = await readJsonBody<unknown>(request, 64 * 1024);
    if ("response" in body) return body.response;
    const product = validateCatalogProduct(body.data);
    const productId = await createCatalogProduct(product);
    return secureJson({ productId, products: await readCatalog(true) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No hemos podido crear el producto.";
    const conflict = /unique|slug/i.test(message);
    return secureJson({ error: conflict ? "Ya existe un producto con ese slug." : message }, { status: conflict ? 409 : 400 });
  }
}

export async function PATCH(request: Request) {
  const rejected = rejectCrossOriginMutation(request) || rejectOversizedRequest(request, 64 * 1024);
  if (rejected) return rejected;
  if (!await getAdminApiUser()) return secureJson({ error: "Acceso no autorizado." }, { status: 403 });
  const limited = takeRateLimit(request, "admin_catalog_write", { limit: 30, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const body = await readJsonBody<{ id?: number; product?: unknown }>(request, 64 * 1024);
    if ("response" in body) return body.response;
    const payload = body.data;
    const productId = Number(payload.id);
    if (!Number.isInteger(productId) || productId < 1) return secureJson({ error: "Identificador de producto inválido." }, { status: 400 });
    await updateCatalogProduct(productId, validateCatalogProduct(payload.product));
    return secureJson({ products: await readCatalog(true) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No hemos podido actualizar el producto.";
    const conflict = /unique|slug/i.test(message);
    return secureJson({ error: conflict ? "Ya existe un producto con ese slug." : message }, { status: conflict ? 409 : 400 });
  }
}
