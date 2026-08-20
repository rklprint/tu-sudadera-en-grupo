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
  const customPricingRequired =
    (selection.frontTechnique === "embroidery" && selection.frontType !== "coordinates") ||
    (selection.sleeveTechnique === "embroidery" && selection.sleeveFlag === "custom");
  const frontExtrasCents =
    selection.frontTechnique === "embroidery" && selection.frontType === "coordinates" ? 100 : 0;
  const sleeveExtrasCents =
    selection.sleeveFlag === "none"
      ? 0
      : selection.sleeveTechnique === "print"
        ? 100
        : selection.sleeveFlag === "custom"
          ? 0
          : 200;
  const commonExtrasCents = frontExtrasCents + sleeveExtrasCents;
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
    designStyle: clean(input.designStyle, 50),
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
