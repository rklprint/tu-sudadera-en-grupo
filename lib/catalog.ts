export type CatalogColor = {
  name: string;
  value: string;
  slug?: string;
  frontImage?: string;
  backImage?: string;
  /** Stable pair identifier for front/back assets of one color. */
  assetKey?: string;
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
  { name: "Granate", slug: "granate", value: "#4b2235", frontImage: "/products/gildan-18500/color-1/front.webp", backImage: "/products/gildan-18500/color-1/back.webp", assetKey: "granate" },
  { name: "Azul cielo", slug: "azul-cielo", value: "#8aaed1", frontImage: "/products/gildan-18500/color-2/front.webp", backImage: "/products/gildan-18500/color-9/back.webp", assetKey: "azul-cielo" },
  { name: "Rosa", slug: "rosa", value: "#f0afc6", frontImage: "/products/gildan-18500/color-3/front.webp", backImage: "/products/gildan-18500/color-8/back.webp", assetKey: "rosa" },
  { name: "Azul petróleo", slug: "azul-petroleo", value: "#3d556b", frontImage: "/products/gildan-18500/color-4/front.webp", backImage: "/products/gildan-18500/color-4/back.webp", assetKey: "azul-petroleo" },
  { name: "Azul marino", slug: "azul-marino", value: "#172952", frontImage: "/products/gildan-18500/color-5/front.webp", backImage: "/products/gildan-18500/color-5/back.webp", assetKey: "azul-marino" },
  { name: "Gris", slug: "gris", value: "#585759", frontImage: "/products/gildan-18500/color-6/front.webp", backImage: "/products/gildan-18500/color-7/back.webp", assetKey: "gris" },
  { name: "Verde oliva", slug: "verde-oliva", value: "#45583d", frontImage: "/products/gildan-18500/color-7/front.webp", backImage: "/products/gildan-18500/color-3/back.webp", assetKey: "verde-oliva" },
  { name: "Verde botella", slug: "verde-botella", value: "#1c331f", frontImage: "/products/gildan-18500/color-8/front.webp", backImage: "/products/gildan-18500/color-2/back.webp", assetKey: "verde-botella" },
  { name: "Negro", slug: "negro", value: "#212021", frontImage: "/products/gildan-18500/color-9/front.webp", backImage: "/products/gildan-18500/color-6/back.webp", assetKey: "negro" },
] as const satisfies readonly CatalogColor[];

export const HOODIE_PRICE_TIERS = [
  { min: 5, max: 10, label: "5–10", unitPriceCents: 3_000 },
  { min: 11, max: 20, label: "11–20", unitPriceCents: 2_800 },
  { min: 21, max: 30, label: "21–30", unitPriceCents: 2_600 },
  { min: 31, max: 40, label: "31–40", unitPriceCents: 2_500 },
  { min: 41, max: 50, label: "41–50", unitPriceCents: 2_400 },
  { min: 51, max: 75, label: "51–75", unitPriceCents: 2_300 },
  { min: 76, max: 100, label: "76–100", unitPriceCents: 2_200 },
  { min: 101, max: null, label: "101+", unitPriceCents: null },
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
