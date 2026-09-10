import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { CORE_COLORS } from "../lib/catalog";

function readVp8xDimensions(buffer: Buffer) {
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "VP8X");
  const width = buffer[24] + (buffer[25] << 8) + (buffer[26] << 16) + 1;
  const height = buffer[27] + (buffer[28] << 8) + (buffer[29] << 16) + 1;
  return { width, height };
}

test("cada color activo del Gildan 18500 tiene frontal y espalda web coherentes", () => {
  const assetKeys = new Set<string>();
  const frontImages = new Set<string>();
  const backImages = new Set<string>();

  for (const color of CORE_COLORS) {
    assert.ok(color.slug, `${color.name}: falta slug`);
    assert.ok(color.assetKey, `${color.name}: falta assetKey`);
    assert.ok(color.frontImage, `${color.name}: falta frontal`);
    assert.ok(color.backImage, `${color.name}: falta espalda`);
    assert.equal(assetKeys.has(color.assetKey), false, `${color.name}: assetKey duplicado`);
    assert.equal(frontImages.has(color.frontImage), false, `${color.name}: frontal duplicado`);
    assert.equal(backImages.has(color.backImage), false, `${color.name}: espalda duplicada`);
    assetKeys.add(color.assetKey);
    frontImages.add(color.frontImage);
    backImages.add(color.backImage);

    for (const [side, image] of [["frontal", color.frontImage], ["espalda", color.backImage]] as const) {
      const absolutePath = resolve(process.cwd(), "public", image.slice(1));
      const bytes = readFileSync(absolutePath);
      assert.deepEqual(readVp8xDimensions(bytes), { width: 2000, height: 2000 }, `${color.name}: ${side} no es 2000×2000`);
    }
  }
});
