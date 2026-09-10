import { DEFAULT_EXTRAS, extraPrice, type CatalogExtra, type CatalogDesign } from "@/lib/customization-catalog";
import {
  unitPriceForQuantity,
  type CatalogPriceTier,
  type CatalogProduct,
} from "@/lib/catalog";

export const COMMERCIAL_TERMS_VERSION = "2026-08-20-front-back-name-v1";
export const COMMERCIAL_BASE_INCLUDES =
  "Sudadera + impresión en pecho + espalda + nombre";

export type ProductCategory = "hoodie" | "tshirt";
export type FrontType = "coordinates" | "logo" | "name";
export type Technique = "print" | "embroidery";
export type SleeveFlag = "none" | "spain" | "community" | "country" | "custom";
export type DesignPath = "template" | "upload" | "studio";

export type PersonalizerSelection = {
  productSlug: string;
  productCategory: ProductCategory;
  product: string;
  model: string;
  color: string;
  printColor: string;
  designPath: DesignPath;
  designStyle: string;
  designFields?: Record<string, string>;
  backDesign: string;
  groupName: string;
  frontType: FrontType;
  frontText: string;
  frontTechnique: Technique;
  frontDesign: string;
  sleeveFlag: SleeveFlag;
  sleeveDetail: string;
  sleeveTechnique: Technique;
  sleeve: string;
};

export type SelectionPricing = {
  baseUnitPriceCents: number | null;
  commonExtrasCents: number;
  quotedUnitPriceCents: number | null;
  customPricingRequired: boolean;
};

export type CommercialSnapshot = SelectionPricing & {
  version: typeof COMMERCIAL_TERMS_VERSION;
  currency: "EUR";
  baseIncludes: typeof COMMERCIAL_BASE_INCLUDES;
  productId: string;
  productSlug: string;
  productCategory: ProductCategory;
  productName: string;
  model: string;
  color: string;
  quantity: number;
  priceTiers: CatalogPriceTier[];
  extras?: CatalogExtra[];
  sizes?: string[];
  createdAt: string;
};

export type ApprovedCommercialSnapshot = {
  approvedAt: string;
  approvedQuantity: number;
  approvedUnitPriceCents: number;
  source: "quoted" | "manual";
};

export type StoredQuoteConfiguration = PersonalizerSelection & {
  basePrice: string;
  configuredPrice: string;
  commercialSnapshot: CommercialSnapshot;
  approvedCommercial?: ApprovedCommercialSnapshot;
  designSnapshot?: CatalogDesign;
  [key: string]: unknown;
};

export function pricingForSelection(
  product: CatalogProduct,
  quantity: number,
  selection: Pick<PersonalizerSelection, "frontType" | "frontTechnique" | "sleeveFlag" | "sleeveTechnique">,
): SelectionPricing {
  const baseUnitPriceCents = product.quoteOnly
    ? null
    : unitPriceForQuantity(quantity, product.priceTiers);
  const extras = (product.extras ?? DEFAULT_EXTRAS).filter(extra => extra.products.includes(product.slug));
  const front = selection.frontTechnique === "embroidery"
    ? extraPrice(selection.frontType === "coordinates" ? "pecho-coordenadas-bordadas" : "pecho-logo-bordado", extras) : 0;
  const sleeve = selection.sleeveFlag === "none" ? 0
    : extraPrice(selection.sleeveTechnique === "print" ? "manga-dtf" : selection.sleeveFlag === "custom" ? "manga-logo-bordado" : "manga-bandera-bordada", extras);
  const customPricingRequired = front === null || sleeve === null;
  const commonExtrasCents = (front ?? 0) + (sleeve ?? 0);
  return {
    baseUnitPriceCents,
    commonExtrasCents,
    quotedUnitPriceCents:
      baseUnitPriceCents === null || customPricingRequired
        ? null
        : baseUnitPriceCents + commonExtrasCents,
    customPricingRequired,
  };
}

export function createCommercialSnapshot(
  product: CatalogProduct,
  quantity: number,
  selection: PersonalizerSelection,
  createdAt = new Date().toISOString(),
): CommercialSnapshot {
  return {
    version: COMMERCIAL_TERMS_VERSION,
    currency: "EUR",
    baseIncludes: COMMERCIAL_BASE_INCLUDES,
    productId: product.id,
    productSlug: product.slug,
    productCategory: product.category,
    productName: product.name,
    model: product.model,
    color: selection.color,
    quantity,
    extras: structuredClone((product.extras ?? DEFAULT_EXTRAS).filter(extra => extra.products.includes(product.slug))),
    sizes: [...product.sizes],
    priceTiers: product.priceTiers.map((tier) => ({ ...tier })),
    ...pricingForSelection(product, quantity, selection),
    createdAt,
  };
}

export function priceFromCommercialSnapshot(
  snapshot: CommercialSnapshot,
  quantity: number,
): number | null {
  const base = unitPriceForQuantity(quantity, snapshot.priceTiers);
  if (base === null || snapshot.customPricingRequired) return null;
  return base + snapshot.commonExtrasCents;
}

export function readCommercialSnapshot(value: unknown): CommercialSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const snapshot = value as Partial<CommercialSnapshot>;
  if (
    snapshot.version !== COMMERCIAL_TERMS_VERSION ||
    snapshot.currency !== "EUR" ||
    !snapshot.productSlug ||
    !snapshot.model ||
    !Array.isArray(snapshot.priceTiers) ||
    !Number.isInteger(snapshot.quantity)
  ) return null;
  return snapshot as CommercialSnapshot;
}

export function normalizePersonalizerSelection(value: unknown): PersonalizerSelection {
  const input = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const productCategory = input.productCategory === "tshirt" ? "tshirt" : "hoodie";
  const frontType = oneOf(input.frontType, ["coordinates", "logo", "name"] as const, "coordinates");
  const frontTechnique = oneOf(input.frontTechnique, ["print", "embroidery"] as const, "print");
  const sleeveFlag = oneOf(input.sleeveFlag, ["none", "spain", "community", "country", "custom"] as const, "none");
  const sleeveTechnique = oneOf(input.sleeveTechnique, ["print", "embroidery"] as const, "print");
  const designPath = oneOf(input.designPath, ["template", "upload", "studio"] as const, "template");
  return {
    productSlug: clean(input.productSlug, 90),
    productCategory,
    product: clean(input.product, 50) || (productCategory === "tshirt" ? "Camiseta" : "Sudadera"),
    model: clean(input.model, 90),
    color: clean(input.color, 50),
    printColor: clean(input.printColor, 50),
    designPath,
    designStyle: clean(input.designStyle, 80),
    designFields: input.designFields && typeof input.designFields === "object" && !Array.isArray(input.designFields)
      ? Object.fromEntries(Object.entries(input.designFields).slice(0, 10).map(([key, value]) => [clean(key, 80), clean(value, 500)])) : {},
    backDesign: clean(input.backDesign, 160),
    groupName: clean(input.groupName, 90),
    frontType,
    frontText: clean(input.frontText, 100),
    frontTechnique,
    frontDesign: clean(input.frontDesign, 160),
    sleeveFlag,
    sleeveDetail: clean(input.sleeveDetail, 100),
    sleeveTechnique,
    sleeve: clean(input.sleeve, 160),
  };
}

export function parseStoredQuoteConfiguration(value: string): Partial<StoredQuoteConfiguration> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Partial<StoredQuoteConfiguration>
      : {};
  } catch {
    return {};
  }
}

function clean(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function oneOf<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] {
  const normalized = String(value || "");
  return (allowed as readonly string[]).includes(normalized)
    ? normalized as T[number]
    : fallback;
}
