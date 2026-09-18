import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from 'node:crypto';
import test from "node:test";
import { CORE_COLORS, TSHIRT_COLORS } from "../lib/catalog";
import { currentHoodieMockup, HOODIE_MOCKUPS, hoodieMockupPath } from '../lib/hoodie-mockups';

function readWebpDimensions(buffer: Buffer) {
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP");
  if (buffer.subarray(12, 16).toString('ascii') === 'VP8L') {
    assert.equal(buffer[20], 0x2f);
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "VP8X");
  const width = buffer[24] + (buffer[25] << 8) + (buffer[26] << 16) + 1;
  const height = buffer[27] + (buffer[28] << 8) + (buffer[29] << 16) + 1;
  return { width, height };
}

for (const [product, colors] of [["Gildan 18500", CORE_COLORS], ["Camiseta", TSHIRT_COLORS]] as const) {
test(`cada color activo de ${product} tiene frontal y espalda web coherentes`, () => {
  const assetKeys = new Set<string>();
  const frontImages = new Set<string>();
  const backImages = new Set<string>();

  for (const color of colors) {
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
      const expected = product === 'Gildan 18500' ? { width: 1139, height: 1381 } : { width: 2000, height: 2000 };
      assert.deepEqual(readWebpDimensions(bytes), expected, `${color.name}: ${side} tiene dimensiones incorrectas`);
    }
  }
});
}

test('definitive hoodie colors match the owner files byte for byte, including legacy pairs', () => {
  const manifest = JSON.parse(readFileSync(resolve('docs/hoodie-assets-provenance.json'), 'utf8'));
  assert.equal(manifest.length, 18);
  for (const pair of HOODIE_MOCKUPS) for (const side of ['front', 'back'] as const) {
    const image = hoodieMockupPath(pair.file, side);
    const color = CORE_COLORS.find(color => color.slug === pair.slug)!;
    assert.equal(color[side === 'front' ? 'frontImage' : 'backImage'], image);
    const source = manifest.find((item: { color: string; side: string }) => item.color === pair.slug && item.side === side);
    assert.equal(source.path, image);
    assert.equal(createHash('sha256').update(readFileSync(resolve('public', image.slice(1)))).digest('hex'), source.sha256);
    assert.equal(currentHoodieMockup(`/products/gildan-18500/color-${side === 'front' ? pair.legacyFront : pair.legacyBack}/${side}.webp`, side), image);
  }
  assert.equal(currentHoodieMockup('/products/custom/front.webp', 'front'), '/products/custom/front.webp');
  assert.equal(currentHoodieMockup(undefined, 'back'), undefined);
});
