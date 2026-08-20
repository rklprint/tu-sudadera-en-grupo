export type CatalogColor = {
  name: string;
  value: string;
};

export type CatalogPriceTier = {
  min: number;
  max: number | null;
  label: string;
  unitPriceCents: number | null;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  category: "hoodie" | "tshirt";
  name: string;
  model: string;
  description: string;
  active: boolean;
  featured: boolean;
  quoteOnly: boolean;
  sizes: readonly string[];
  colors: readonly CatalogColor[];
  priceTiers: readonly CatalogPriceTier[];
};

export const CORE_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;

export const CORE_COLORS = [
  { name: "Azul marino", value: "#14223e" },
  { name: "Verde botella", value: "#174f42" },
  { name: "Burdeos", value: "#753247" },
  { name: "Gris", value: "#aeb1b5" },
  { name: "Negro", value: "#202124" },
  { name: "Rojo", value: "#a93642" },
  { name: "Blanco", value: "#f2f1ed" },
] as const satisfies readonly CatalogColor[];

export const HOODIE_PRICE_TIERS = [
  { min: 5, max: 10, label: "5–10", unitPriceCents: 3_000 },
  { min: 11, max: 20, label: "11–20", unitPriceCents: 2_800 },
  { min: 21, max: 30, label: "21–30", unitPriceCents: 2_600 },
  { min: 31, max: 40, label: "31–40", unitPriceCents: 2_500 },
  { min: 41, max: 50, label: "41–50", unitPriceCents: 2_400 },
  { min: 51, max: 75, label: "51–75", unitPriceCents: 2_300 },
  { min: 76, max: 99, label: "76–99", unitPriceCents: 2_200 },
  { min: 100, max: null, label: "100+", unitPriceCents: null },
] as const satisfies readonly CatalogPriceTier[];

export const DEFAULT_CATALOG = [
  {
    id: "hoodie-gildan-18500",
    slug: "sudadera-gildan-18500",
    category: "hoodie",
    name: "Sudadera personalizada",
    model: "Gildan 18500",
    description: "Heavy Blend unisex, tallas S–3XL y personalización para grupos.",
    active: true,
    featured: true,
    quoteOnly: false,
    sizes: CORE_SIZES,
    colors: CORE_COLORS,
    priceTiers: HOODIE_PRICE_TIERS,
  },
  {
    id: "tshirt-pending",
    slug: "camiseta-personalizada",
    category: "tshirt",
    name: "Camiseta personalizada",
    model: "Modelo por confirmar",
    description: "Producto secundario preparado para incorporarse sin inventar modelo ni tarifa.",
    active: true,
    featured: false,
    quoteOnly: true,
    sizes: CORE_SIZES,
    colors: CORE_COLORS,
    priceTiers: [],
  },
] as const satisfies readonly CatalogProduct[];

export function unitPriceForQuantity(
  quantity: number,
  tiers: readonly CatalogPriceTier[] = HOODIE_PRICE_TIERS,
): number | null {
  const tier = tiers.find(({ min, max }) => quantity >= min && (max === null || quantity <= max));
  return tier?.unitPriceCents ?? null;
}
