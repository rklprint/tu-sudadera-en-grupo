import assert from "node:assert/strict";
import test from "node:test";
import { HOODIE_PRICE_TIERS, unitPriceForQuantity } from "../lib/catalog";
import { extrasForGarmentCents, hashPrivateToken, validateGarments } from "../lib/group-orders";

test("aplica todos los tramos públicos confirmados de sudaderas", () => {
  const cases: Array<[number, number | null]> = [
    [1, null], [4, null], [5, 3000], [10, 3000], [11, 2800], [20, 2800],
    [21, 2600], [30, 2600], [31, 2500], [40, 2500], [41, 2400], [50, 2400],
    [51, 2300], [75, 2300], [76, 2200], [100, 2200], [101, null],
  ];
  for (const [quantity, expected] of cases) {
    assert.equal(unitPriceForQuantity(quantity, HOODIE_PRICE_TIERS), expected, `cantidad ${quantity}`);
  }
});

test("suma extras cerrados y deriva a presupuesto los bordados propios", () => {
  const standard = {
    printName: "LUCÍA",
    size: "M",
    namePlacement: "front" as const,
    frontExtra: "coordinates" as const,
    frontDetail: "40.4168, -3.7038",
    sleeveExtra: "embroidered_flag" as const,
    sleeveDetail: "Madrid",
  };
  assert.equal(extrasForGarmentCents(standard), 300);
  assert.equal(extrasForGarmentCents({ ...standard, sleeveExtra: "custom_embroidery" }), null);
});

test("valida cada prenda y rechaza tallas fuera del catálogo", () => {
  assert.deepEqual(validateGarments([{ printName: "ANA", size: "XS" }]), { error: "Selecciona una talla válida entre S y 3XL." });
  const valid = validateGarments([{ printName: "ANA", size: "3xl", namePlacement: "back" }]);
  assert.ok("garments" in valid);
  if ("garments" in valid) assert.equal(valid.garments[0].size, "3XL");
});

test("los enlaces personales se comparan mediante un hash estable", async () => {
  const token = "edit_4fcb052d13974c6d8e9ddaa3";
  const hash = await hashPrivateToken(token);
  assert.equal(hash.length, 64);
  assert.equal(hash, await hashPrivateToken(token));
  assert.notEqual(hash, token);
});
