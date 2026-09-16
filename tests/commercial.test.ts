import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_CATALOG, type CatalogProduct } from "../lib/catalog";
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
  assert.equal(priceFromCommercialSnapshot(snapshot, 99), 2200);
  assert.equal(priceFromCommercialSnapshot(snapshot, 100), null);
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

test("Gildan 2000 uses VAT-inclusive shirt prices at every boundary and preserves quoted terms", () => {
  const shirt: CatalogProduct = structuredClone(DEFAULT_CATALOG[1]);
  for (const [quantity, cents] of [[5,1500],[10,1500],[11,1300],[20,1300],[21,1100],[30,1100],[31,950],[40,950],[41,900],[50,900],[51,850],[75,850],[76,800],[99,800],[100,null],[500,null]] as const) {
    assert.equal(pricingForSelection(shirt, quantity, selection).quotedUnitPriceCents, cents, `${quantity} shirts`);
  }
  assert.equal(pricingForSelection(shirt, 35, { ...selection, sleeveFlag: 'community', sleeveTechnique: 'print' }).quotedUnitPriceCents, 1050);
  assert.equal(pricingForSelection(shirt, 35, { ...selection, sleeveFlag: 'community', sleeveTechnique: 'embroidery' }).quotedUnitPriceCents, 1150);
  assert.equal(pricingForSelection(shirt, 35, { ...selection, frontType: 'logo', frontTechnique: 'embroidery' }).quotedUnitPriceCents, null);
  const snapshot = createCommercialSnapshot(shirt, 35, { ...selection, productCategory: 'tshirt', productSlug: shirt.slug, product: 'Camiseta', model: shirt.model });
  assert.equal(snapshot.model, 'Gildan 2000');
  assert.equal(snapshot.baseIncludes, 'Camiseta + impresión en pecho + espalda + nombre');
  shirt.priceTiers = [];
  assert.equal(priceFromCommercialSnapshot(snapshot, 35), 950);
  assert.equal(priceFromCommercialSnapshot(snapshot, 100), null);
});

test("existing commercial snapshots keep the former 100-unit price", () => {
  const previous = createCommercialSnapshot(product, 100, selection);
  previous.priceTiers = previous.priceTiers.map(tier => tier.min === 76
    ? { ...tier, max: 100 } : tier.min === 100 ? { ...tier, min: 101 } : tier);
  assert.equal(priceFromCommercialSnapshot(previous, 100), 2200);
  assert.equal(pricingForSelection(product, 99, selection).quotedUnitPriceCents, 2200);
  assert.equal(pricingForSelection(product, 100, selection).quotedUnitPriceCents, null);
});
