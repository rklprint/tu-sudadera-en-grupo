import { DEFAULT_EXTRAS, extraPrice, type CatalogExtra } from "@/lib/customization-catalog";
import { parseStoredQuoteConfiguration, readCommercialSnapshot } from "@/lib/commercial";
import { CORE_COLORS, CORE_SIZES, unitPriceForQuantity } from "@/lib/catalog";

export const GROUP_SIZES = CORE_SIZES;
export const GROUP_COLORS = CORE_COLORS.map(({ name }) => name);

export type GarmentInput = {
  printName: string;
  size: string;
  namePlacement: "front" | "back";
  frontExtra: "none" | "coordinates" | "custom_embroidery";
  frontDetail: string;
  sleeveExtra: "none" | "dtf_flag" | "embroidered_flag" | "custom_embroidery";
  sleeveDetail: string;
};

export function priceForQuantityCents(quantity: number): number | null {
  return unitPriceForQuantity(quantity);
}

export function groupSizes(configurationJson: string): readonly string[] {
  return readCommercialSnapshot(parseStoredQuoteConfiguration(configurationJson).commercialSnapshot)?.sizes ?? GROUP_SIZES;
}

export function groupExtras(configurationJson: string): CatalogExtra[] {
  return readCommercialSnapshot(parseStoredQuoteConfiguration(configurationJson).commercialSnapshot)?.extras ?? DEFAULT_EXTRAS;
}

export function garmentExtraIds(garment: GarmentInput): string[] {
  return [garment.frontExtra === "none" ? "" : garment.frontExtra === "coordinates" ? "pecho-coordenadas-bordadas" : "pecho-logo-bordado",
    garment.sleeveExtra === "none" ? "" : garment.sleeveExtra === "dtf_flag" ? "manga-dtf" : garment.sleeveExtra === "embroidered_flag" ? "manga-bandera-bordada" : "manga-logo-bordado"].filter(Boolean);
}

export function extrasForGarmentCents(garment: GarmentInput, extras: readonly CatalogExtra[] = DEFAULT_EXTRAS): number | null {
  const front = garment.frontExtra === "none" ? 0 : extraPrice(garment.frontExtra === "coordinates" ? "pecho-coordenadas-bordadas" : "pecho-logo-bordado", extras);
  const sleeve = garment.sleeveExtra === "none" ? 0 : extraPrice(garment.sleeveExtra === "dtf_flag" ? "manga-dtf" : garment.sleeveExtra === "embroidered_flag" ? "manga-bandera-bordada" : "manga-logo-bordado", extras);
  return front === null || sleeve === null ? null : front + sleeve;
}

export function validateGarments(value: unknown, sizes: readonly string[] = GROUP_SIZES): { garments: GarmentInput[] } | { error: string } {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) {
    return { error: "Añade entre 1 y 12 prendas en este registro." };
  }

  const garments: GarmentInput[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") return { error: "Hay una prenda incompleta." };
    const item = raw as Record<string, unknown>;
    const printName = String(item.printName || "").trim().slice(0, 40);
    const size = String(item.size || "").toUpperCase();
    const namePlacement = item.namePlacement === "back" ? "back" : "front";
    const frontExtra = ["none", "coordinates", "custom_embroidery"].includes(String(item.frontExtra))
      ? item.frontExtra as GarmentInput["frontExtra"]
      : "none";
    const frontDetail = String(item.frontDetail || "").trim().slice(0, 100);
    const sleeveExtra = ["none", "dtf_flag", "embroidered_flag", "custom_embroidery"].includes(String(item.sleeveExtra))
      ? item.sleeveExtra as GarmentInput["sleeveExtra"]
      : "none";
    const sleeveDetail = String(item.sleeveDetail || "").trim().slice(0, 100);

    if (!printName) return { error: "Indica el nombre que llevará cada prenda." };
    if (!sizes.includes(size)) return { error: "Selecciona una talla válida entre S y 3XL." };
    if (frontExtra !== "none" && !frontDetail) return { error: "Indica las coordenadas o el logotipo del extra de pecho." };
    if (sleeveExtra !== "none" && !sleeveDetail) return { error: "Indica qué bandera o logotipo llevará la manga." };

    garments.push({ printName, size, namePlacement, frontExtra, frontDetail, sleeveExtra, sleeveDetail });
  }

  return { garments };
}

export function createAccessCode(): string {
  return `TSG-${randomHex(10).toUpperCase()}`;
}

export function createEditToken(): string {
  return `edit_${randomHex(24)}`;
}

export async function hashPrivateToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function createEditTokenExpiry(): string {
  const expiry = new Date();
  expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);
  return expiry.toISOString();
}

export function normalizeCode(value: string): string {
  return decodeURIComponent(value).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
}

function randomHex(bytesLength: number): string {
  const bytes = new Uint8Array(bytesLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}
