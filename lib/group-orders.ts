export const GROUP_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;

export const GROUP_COLORS = [
  "Negro",
  "Blanco",
  "Azul marino",
  "Gris",
  "Rojo",
  "Verde botella",
  "Burdeos",
] as const;

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
  if (quantity < 5 || quantity >= 100) return null;
  if (quantity <= 10) return 3000;
  if (quantity <= 20) return 2800;
  if (quantity <= 30) return 2600;
  if (quantity <= 40) return 2500;
  if (quantity <= 50) return 2400;
  if (quantity <= 75) return 2300;
  return 2200;
}

export function extrasForGarmentCents(garment: GarmentInput): number | null {
  if (garment.frontExtra === "custom_embroidery" || garment.sleeveExtra === "custom_embroidery") return null;

  const front = garment.frontExtra === "coordinates" ? 100 : 0;
  const sleeve = garment.sleeveExtra === "dtf_flag" ? 100 : garment.sleeveExtra === "embroidered_flag" ? 200 : 0;
  return front + sleeve;
}

export function validateGarments(value: unknown): { garments: GarmentInput[] } | { error: string } {
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
    if (!GROUP_SIZES.includes(size as (typeof GROUP_SIZES)[number])) return { error: "Selecciona una talla válida entre S y 3XL." };
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

export function normalizeCode(value: string): string {
  return decodeURIComponent(value).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
}

function randomHex(bytesLength: number): string {
  const bytes = new Uint8Array(bytesLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}
