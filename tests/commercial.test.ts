import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_CATALOG } from "../lib/catalog";
import { COMMERCIAL_BASE_INCLUDES, createCommercialSnapshot, priceFromCommercialSnapshot, pricingForSelection } from "../lib/commercial";

const product = DEFAULT_CATALOG[0];
const selection = {
  productSlug: product.slug,
  productCategory: "hoodie" as const,
  product: "Sudadera",
  model: product.model,
  color: "Azul marino",
  printColor: "Blanco",
  designPath: "template" as const,
  designStyle: "classic",
  backDesign: "PROMO 26",
  groupName: "E2E",
  frontType: "coordinates" as const,
  frontText: "40N 3W",
  frontTechnique: "print" as const,
  frontDesign: "Coordenadas",
  sleeveFlag: "none" as const,
  sleeveDetail: "",
  sleeveTechnique: "print" as const,
  sleeve: "Sin extra",
};

test("freezes the commercial table and the exact base inclusion", () => {
  const snapshot = createCommercialSnapshot(product, 25, selection, "2026-08-20T00:00:00.000Z");
  assert.equal(snapshot.baseIncludes, COMMERCIAL_BASE_INCLUDES);
  assert.equal(snapshot.quotedUnitPriceCents, 2600);
  assert.equal(priceFromCommercialSnapshot(snapshot, 25), 2600);
  assert.equal(priceFromCommercialSnapshot(snapshot, 30), 2600);
  assert.equal(priceFromCommercialSnapshot(snapshot, 31), 2500);
  assert.equal(priceFromCommercialSnapshot(snapshot, 100), 2200);
  assert.equal(priceFromCommercialSnapshot(snapshot, 101), null);
  assert.equal(priceFromCommercialSnapshot(snapshot, 500), null);
});

test("common supplements are added once and custom embroidery requires review", () => {
  assert.deepEqual(pricingForSelection(product, 25, { ...selection, sleeveFlag: "spain", sleeveTechnique: "print" }), {
    baseUnitPriceCents: 2600,
    commonExtrasCents: 100,
    quotedUnitPriceCents: 2700,
    customPricingRequired: false,
  });
  const custom = pricingForSelection(product, 25, { ...selection, frontType: "logo", frontTechnique: "embroidery" });
  assert.equal(custom.quotedUnitPriceCents, null);
  assert.equal(custom.customPricingRequired, true);
});
