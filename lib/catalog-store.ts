import { ensureQuoteSchema } from "@/db";
import type { CatalogColor, CatalogPriceTier, CatalogProduct } from "@/lib/catalog";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";

type ProductRow = {
  id: number;
  slug: string;
  category: "hoodie" | "tshirt";
  name: string;
  model: string;
  description: string;
  quote_only: number;
  active: number;
  featured: number;
  position: number;
  seo_title: string;
  seo_description: string;
};

export type ManagedCatalogProduct = CatalogProduct & {
  numericId: number;
  position: number;
  seoTitle: string;
  seoDescription: string;
};

export type CatalogProductInput = {
  name: string;
  slug: string;
  category: "hoodie" | "tshirt";
  model: string;
  description: string;
  active: boolean;
  featured: boolean;
  quoteOnly: boolean;
  position: number;
  seoTitle: string;
  seoDescription: string;
  sizes: string[];
  colors: CatalogColor[];
  priceTiers: CatalogPriceTier[];
};

export async function readCatalog(includeInactive = false): Promise<ManagedCatalogProduct[]> {
  await ensureQuoteSchema();
  const { DB } = getSiteRuntimeEnv();
  if (!DB) throw new Error("Catalog database unavailable");

  const where = includeInactive ? "" : "WHERE active = 1";
  const [productResult, colorResult, sizeResult, tierResult] = await Promise.all([
    DB.prepare(`SELECT id, slug, category, name, model, description, quote_only, active, featured, position, seo_title, seo_description FROM products ${where} ORDER BY position, id`).all<ProductRow>(),
    DB.prepare("SELECT product_id, name, hex FROM product_colors WHERE active = 1 ORDER BY position, id").all<{ product_id: number; name: string; hex: string }>(),
    DB.prepare("SELECT product_id, name FROM product_sizes WHERE active = 1 ORDER BY position, id").all<{ product_id: number; name: string }>(),
    DB.prepare("SELECT product_id, min_quantity, max_quantity, unit_price_cents FROM product_price_tiers ORDER BY position, min_quantity").all<{ product_id: number; min_quantity: number; max_quantity: number | null; unit_price_cents: number | null }>(),
  ]);

  const productRows = (productResult.results || []) as ProductRow[];
  const colorRows = (colorResult.results || []) as { product_id: number; name: string; hex: string }[];
  const sizeRows = (sizeResult.results || []) as { product_id: number; name: string }[];
  const tierRows = (tierResult.results || []) as { product_id: number; min_quantity: number; max_quantity: number | null; unit_price_cents: number | null }[];

  return productRows.map((product: ProductRow) => {
    const priceTiers = tierRows
      .filter((tier: (typeof tierRows)[number]) => tier.product_id === product.id)
      .map((tier: (typeof tierRows)[number]) => ({
        min: tier.min_quantity,
        max: tier.max_quantity,
        label: tier.max_quantity === null ? `${tier.min_quantity}+` : `${tier.min_quantity}–${tier.max_quantity}`,
        unitPriceCents: tier.unit_price_cents,
      }));

    return {
      id: String(product.id),
      numericId: product.id,
      slug: product.slug,
      category: product.category,
      name: product.name,
      model: product.model,
      description: product.description,
      quoteOnly: product.quote_only === 1,
      active: product.active === 1,
      featured: product.featured === 1,
      position: product.position,
      seoTitle: product.seo_title,
      seoDescription: product.seo_description,
      sizes: sizeRows.filter((size: (typeof sizeRows)[number]) => size.product_id === product.id).map((size: (typeof sizeRows)[number]) => size.name),
      colors: colorRows.filter((color: (typeof colorRows)[number]) => color.product_id === product.id).map((color: (typeof colorRows)[number]) => ({ name: color.name, value: color.hex })),
      priceTiers,
    };
  });
}

export function validateCatalogProduct(input: unknown): CatalogProductInput {
  if (!input || typeof input !== "object") throw new Error("Los datos del producto no son válidos.");
  const value = input as Partial<CatalogProductInput>;
  const name = cleanText(value.name, 80);
  const slug = cleanText(value.slug, 90).toLowerCase();
  const model = cleanText(value.model, 90);
  const description = cleanText(value.description, 700);
  const seoTitle = cleanText(value.seoTitle, 70);
  const seoDescription = cleanText(value.seoDescription, 170);
  if (name.length < 3 || model.length < 2) throw new Error("Nombre y modelo son obligatorios.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("El slug solo puede contener letras minúsculas, números y guiones.");
  if (value.category !== "hoodie" && value.category !== "tshirt") throw new Error("La categoría no es válida.");

  const sizes = Array.isArray(value.sizes) ? [...new Set(value.sizes.map((size) => cleanText(size, 12).toUpperCase()).filter(Boolean))] : [];
  if (!sizes.length || sizes.length > 20) throw new Error("Define entre 1 y 20 tallas.");
  const colors = Array.isArray(value.colors) ? value.colors.map((color) => ({ name: cleanText(color?.name, 40), value: String(color?.value || "").toLowerCase() })) : [];
  if (!colors.length || colors.length > 20 || colors.some((color) => !color.name || !/^#[0-9a-f]{6}$/.test(color.value))) throw new Error("Define colores válidos en formato hexadecimal.");

  const priceTiers = Array.isArray(value.priceTiers) ? value.priceTiers.map((tier) => ({
    min: Number(tier?.min),
    max: tier?.max === null ? null : Number(tier?.max),
    label: "",
    unitPriceCents: tier?.unitPriceCents === null ? null : Number(tier?.unitPriceCents),
  })).sort((a, b) => a.min - b.min) : [];
  for (let index = 0; index < priceTiers.length; index += 1) {
    const tier = priceTiers[index];
    const previous = priceTiers[index - 1];
    if (!Number.isInteger(tier.min) || tier.min < 1 || (tier.max !== null && (!Number.isInteger(tier.max) || tier.max < tier.min))) throw new Error("Hay un tramo de cantidades inválido.");
    if (tier.unitPriceCents !== null && (!Number.isInteger(tier.unitPriceCents) || tier.unitPriceCents < 100 || tier.unitPriceCents > 100_000)) throw new Error("Hay un precio fuera del rango permitido.");
    if (previous && (previous.max === null || tier.min <= previous.max)) throw new Error("Los tramos de precio se solapan.");
    tier.label = tier.max === null ? `${tier.min}+` : `${tier.min}–${tier.max}`;
  }
  if (!value.quoteOnly && !priceTiers.length) throw new Error("Un producto con precio público necesita al menos un tramo.");

  return {
    name,
    slug,
    category: value.category,
    model,
    description,
    active: value.active !== false,
    featured: value.featured === true,
    quoteOnly: value.quoteOnly === true,
    position: Number.isInteger(value.position) ? Math.max(0, Math.min(999, Number(value.position))) : 0,
    seoTitle,
    seoDescription,
    sizes,
    colors,
    priceTiers,
  };
}

export async function createCatalogProduct(input: CatalogProductInput) {
  await ensureQuoteSchema();
  const { DB } = getSiteRuntimeEnv();
  if (!DB) throw new Error("Catalog database unavailable");
  await DB.prepare(`INSERT INTO products (name, slug, category, model, description, quote_only, active, featured, position, seo_title, seo_description, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
    .bind(input.name, input.slug, input.category, input.model, input.description, input.quoteOnly ? 1 : 0, input.active ? 1 : 0, input.featured ? 1 : 0, input.position, input.seoTitle, input.seoDescription)
    .run();
  const product = await DB.prepare("SELECT id FROM products WHERE slug = ?").bind(input.slug).first<{ id: number }>();
  if (!product) throw new Error("No se ha podido crear el producto.");
  await replaceVariants(product.id, input);
  return product.id;
}

export async function updateCatalogProduct(productId: number, input: CatalogProductInput) {
  await ensureQuoteSchema();
  const { DB } = getSiteRuntimeEnv();
  if (!DB) throw new Error("Catalog database unavailable");
  const existing = await DB.prepare("SELECT id FROM products WHERE id = ?").bind(productId).first<{ id: number }>();
  if (!existing) throw new Error("No existe ese producto.");
  await DB.prepare(`UPDATE products SET name = ?, slug = ?, category = ?, model = ?, description = ?, quote_only = ?, active = ?, featured = ?, position = ?, seo_title = ?, seo_description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(input.name, input.slug, input.category, input.model, input.description, input.quoteOnly ? 1 : 0, input.active ? 1 : 0, input.featured ? 1 : 0, input.position, input.seoTitle, input.seoDescription, productId)
    .run();
  await replaceVariants(productId, input);
}

async function replaceVariants(productId: number, input: CatalogProductInput) {
  const { DB } = getSiteRuntimeEnv();
  if (!DB) throw new Error("Catalog database unavailable");
  const statements = [
    DB.prepare("DELETE FROM product_colors WHERE product_id = ?").bind(productId),
    DB.prepare("DELETE FROM product_sizes WHERE product_id = ?").bind(productId),
    DB.prepare("DELETE FROM product_price_tiers WHERE product_id = ?").bind(productId),
    ...input.colors.map((color, index) => DB.prepare("INSERT INTO product_colors (product_id, name, hex, position) VALUES (?, ?, ?, ?)").bind(productId, color.name, color.value, index + 1)),
    ...input.sizes.map((size, index) => DB.prepare("INSERT INTO product_sizes (product_id, name, position) VALUES (?, ?, ?)").bind(productId, size, index + 1)),
    ...input.priceTiers.map((tier, index) => DB.prepare("INSERT INTO product_price_tiers (product_id, min_quantity, max_quantity, unit_price_cents, position) VALUES (?, ?, ?, ?, ?)").bind(productId, tier.min, tier.max, tier.unitPriceCents, index + 1)),
  ];
  await DB.batch(statements);
}

function cleanText(value: unknown, maxLength: number) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
