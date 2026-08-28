import { drizzle } from "drizzle-orm/d1";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import { CORE_COLORS, CORE_SIZES, HOODIE_PRICE_TIERS } from "@/lib/catalog";
import * as schema from "./schema";

export async function ensureQuoteSchema() {
  const { DB } = getSiteRuntimeEnv();
  if (!DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }

  // Cloudflare/Sites applies the immutable Drizzle migrations before the
  // Worker starts. Runtime schema DDL can race across isolates and lets tests
  // drift away from staging, so requests only perform the idempotent seed.
  await seedCatalog(DB);
}

export function getDb() {
  const { DB } = getSiteRuntimeEnv();
  if (!DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(DB, { schema });
}

async function seedCatalog(DB: NonNullable<ReturnType<typeof getSiteRuntimeEnv>["DB"]>) {
  await DB.batch([
    DB.prepare(`INSERT OR IGNORE INTO products (name, slug, category, model, description, quote_only, active, featured, position)
      VALUES ('Sudadera personalizada', 'sudadera-gildan-18500', 'hoodie', 'Gildan 18500', 'Heavy Blend unisex para grupos.', 0, 1, 1, 1)`),
    DB.prepare(`INSERT OR IGNORE INTO products (name, slug, category, model, description, quote_only, active, featured, position)
      VALUES ('Camiseta personalizada', 'camiseta-personalizada', 'tshirt', 'Modelo por confirmar', 'Producto secundario pendiente de modelo y tarifa definitivos.', 1, 1, 0, 2)`),
    DB.prepare(`INSERT OR IGNORE INTO extras (name, slug, description, placement, technique, price_cents, quote_only, active, position)
      VALUES ('Bandera o logo en manga · DTF', 'manga-dtf', 'Impresión adicional en manga.', 'sleeve', 'dtf', 100, 0, 1, 1)`),
    DB.prepare(`INSERT OR IGNORE INTO extras (name, slug, description, placement, technique, price_cents, quote_only, active, position)
      VALUES ('Bandera de país o comunidad · bordada', 'manga-bandera-bordada', 'Bandera bordada en manga.', 'sleeve', 'embroidery', 200, 0, 1, 2)`),
    DB.prepare(`INSERT OR IGNORE INTO extras (name, slug, description, placement, technique, price_cents, quote_only, active, position)
      VALUES ('Coordenadas en pecho · bordadas', 'pecho-coordenadas-bordadas', 'Coordenadas bordadas en pecho.', 'front', 'embroidery', 100, 0, 1, 3)`),
    DB.prepare(`INSERT OR IGNORE INTO extras (name, slug, description, placement, technique, price_cents, quote_only, active, position)
      VALUES ('Logo propio bordado · pecho', 'pecho-logo-bordado', 'Precio según tamaño, puntadas y complejidad.', 'front', 'embroidery', NULL, 1, 1, 4)`),
    DB.prepare(`INSERT OR IGNORE INTO extras (name, slug, description, placement, technique, price_cents, quote_only, active, position)
      VALUES ('Logo propio bordado · manga', 'manga-logo-bordado', 'Precio según tamaño, puntadas y complejidad.', 'sleeve', 'embroidery', NULL, 1, 1, 5)`),
  ]);

  const productRows = await DB.prepare("SELECT id, slug FROM products WHERE slug IN ('sudadera-gildan-18500', 'camiseta-personalizada')").all<{ id: number; slug: string }>();
  const productIds = new Map((productRows.results || []).map((row: { id: number; slug: string }) => [row.slug, row.id]));
  const hoodieId = productIds.get("sudadera-gildan-18500");
  const tshirtId = productIds.get("camiseta-personalizada");
  if (!hoodieId || !tshirtId) return;

  const variants = [hoodieId, tshirtId].flatMap((productId) => [
    ...CORE_COLORS.map((color, position) => DB.prepare("INSERT OR IGNORE INTO product_colors (product_id, name, hex, position) VALUES (?, ?, ?, ?)").bind(productId, color.name, color.value, position + 1)),
    ...CORE_SIZES.map((size, position) => DB.prepare("INSERT OR IGNORE INTO product_sizes (product_id, name, position) VALUES (?, ?, ?)").bind(productId, size, position + 1)),
  ]);
  const tiers = HOODIE_PRICE_TIERS.map((tier, position) => DB.prepare("INSERT OR IGNORE INTO product_price_tiers (product_id, min_quantity, max_quantity, unit_price_cents, position) VALUES (?, ?, ?, ?, ?)").bind(hoodieId, tier.min, tier.max, tier.unitPriceCents, position + 1));
  await DB.batch([
    DB.prepare("UPDATE product_price_tiers SET max_quantity = 100 WHERE product_id = ? AND min_quantity = 76 AND max_quantity = 99 AND unit_price_cents = 2200").bind(hoodieId),
    DB.prepare("UPDATE product_price_tiers SET min_quantity = 101 WHERE product_id = ? AND min_quantity = 100 AND max_quantity IS NULL AND unit_price_cents IS NULL AND NOT EXISTS (SELECT 1 FROM product_price_tiers AS existing WHERE existing.product_id = product_price_tiers.product_id AND existing.min_quantity = 101)").bind(hoodieId),
  ]);
  await DB.batch([...variants, ...tiers]);

  await DB.prepare(`INSERT OR IGNORE INTO product_extras (product_id, extra_id)
    SELECT ?, id FROM extras WHERE active = 1`).bind(hoodieId).run();
}
