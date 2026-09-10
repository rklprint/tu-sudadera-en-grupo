import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolveSleeveFlag, sleevePlacement, SLEEVE_FLAGS, type SleeveSelection } from '../lib/sleeve-preview';

const selection = (type: SleeveSelection['type'], detail = ''): SleeveSelection => ({ type, detail, technique: 'print' });

test('sleeve artwork resolves the exact selection and never substitutes a country', () => {
  assert.equal(resolveSleeveFlag(selection('spain'))?.id, 'espana');
  assert.equal(resolveSleeveFlag(selection('community', ' andalucia '))?.id, 'andalucia');
  assert.equal(resolveSleeveFlag(selection('community', 'Catalunya'))?.id, 'cataluna');
  assert.equal(resolveSleeveFlag(selection('country', 'Portugal'))?.id, 'portugal');
  for (const s of [selection('none'), selection('custom', 'España'), selection('country', 'Andalucía'), selection('country', 'Italia'), selection('community', ''), selection('community', 'Andalucía con logo')]) {
    assert.equal(resolveSleeveFlag(s), undefined);
  }
});

test('the same sleeve changes screen side only for calibrated product images', () => {
  const front = sleevePlacement('sudadera-gildan-18500', '/products/gildan-18500/color-7/front.webp', 'front');
  const back = sleevePlacement('sudadera-gildan-18500', '/products/gildan-18500/color-3/back.webp', 'back');
  assert.ok(front && back);
  assert.ok(front.x < 50 && back.x > 50);
  assert.equal(front.width, back.width);
  assert.equal(sleevePlacement('camiseta-personalizada', '/products/gildan-18500/color-3/back.webp', 'back'), undefined);
  assert.equal(sleevePlacement('sudadera-gildan-18500', undefined, 'front'), undefined);
  assert.equal(sleevePlacement('sudadera-gildan-18500', '/uploads/custom-image.png', 'front'), undefined);
  assert.equal(sleevePlacement('sudadera-gildan-18500', '/products/gildan-18500/color-3/back.webp', 'front'), undefined);
});

test('all flag artwork exists locally and contains no executable SVG or remote references', async () => {
  for (const flag of SLEEVE_FLAGS) {
    const svg = await readFile(new URL(`../public${flag.file}`, import.meta.url), 'utf8');
    assert.match(svg, /<svg\b/);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bon\w+\s*=|(?:href|src)=["'](?:https?:|data:|javascript:)|<!ENTITY/i);
  }
});

test('the renderer omits flags when the garment or placement is unavailable', async () => {
  const source = await readFile(new URL('../app/_components/product-preview.tsx', import.meta.url), 'utf8');
  assert.match(source, /flag && placement && src && failed !== src && failedFlag !== flag.file/);
  assert.match(source, /onError=\{\(\) => setFailedFlag\(flag.file\)\}/);
});
