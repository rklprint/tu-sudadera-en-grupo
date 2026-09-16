import assert from 'node:assert/strict';
import test from 'node:test';
import { canPreviewDesign, DEFAULT_EXTRAS, publicAssetPath, validateDesigns } from '../lib/customization-catalog';
import { DEFAULT_CATALOG } from '../lib/catalog';
import { extrasForGarmentCents, groupExtras } from '../lib/group-orders';
import { createCommercialSnapshot, normalizePersonalizerSelection } from '../lib/commercial';
import { APPROVED_DESIGNS, designsForProduct } from '../lib/approved-designs';

test('public catalog paths cannot expose private files or remote active content', () => {
  for (const path of ['/api/admin/presupuestos/code/archivo', '/quote-designs/file.png', '/products/../private.png', 'https://example.invalid/file.png', '/products/file.svg', '/products/file.png?token=private']) {
    assert.throws(() => publicAssetPath(path, 'product'));
  }
  assert.equal(publicAssetPath('/products/model/color/front.webp', 'product'), '/products/model/color/front.webp');
  assert.equal(publicAssetPath('/designs/approved.svg', 'design'), '/designs/approved.svg');
});

test('design catalog rejects overflow, duplicate ids and missing active files', () => {
  const design = { id: 'test-design', name: 'Test only', file: '/designs/test.png', view: 'back', position: { x: 30, y: 30 }, size: { width: 40, height: 40 }, products: ['sudadera-gildan-18500'], personalizable: false, fields: [], active: true, order: 0 };
  assert.equal(validateDesigns([design])[0].id, design.id);
  assert.throws(() => validateDesigns([design, design]));
  assert.throws(() => validateDesigns([{ ...design, file: '' }]));
  assert.throws(() => validateDesigns([{ ...design, position: { x: 90, y: 90 } }]));
  assert.throws(() => validateDesigns([{ ...design, thumbnail: '/api/admin/presupuestos/code/archivo' }]));
  assert.throws(() => validateDesigns([{ ...design, thumbnail: 'https://example.invalid/private.png' }]));
});

test('approved artwork never replaces managed entries or leaks to another garment', () => {
  const managed = [{ ...APPROVED_DESIGNS[0], active: false, file: '/designs/custom.webp' }];
  assert.deepEqual(designsForProduct('sudadera-gildan-18500', 'Gildan 18500', managed), managed);
  assert.deepEqual(designsForProduct('camiseta-personalizada', 'Gildan 18500', []), []);
  assert.deepEqual(designsForProduct('sudadera-gildan-18500', 'Otro modelo', []), []);
  const defaults = designsForProduct('sudadera-gildan-18500', 'Gildan 18500', []);
  assert.equal(validateDesigns(defaults).length, 6);
  defaults[0].active = false;
  assert.equal(APPROVED_DESIGNS[0].active, true);
});

test('individual extras remain frozen when current catalog changes', () => {
  const extras = structuredClone(DEFAULT_EXTRAS);
  const product = { ...DEFAULT_CATALOG[0], extras };
  const snapshot = createCommercialSnapshot(product, 25, normalizePersonalizerSelection({ productCategory: 'hoodie', frontTechnique: 'print' }));
  extras[0].priceCents = 900;
  const garment = { printName: 'Test', size: 'M', namePlacement: 'front' as const, frontExtra: 'coordinates' as const, frontDetail: 'Test', sleeveExtra: 'none' as const, sleeveDetail: '' };
  assert.equal(extrasForGarmentCents(garment, groupExtras(JSON.stringify({ commercialSnapshot: snapshot }))), 100);
  assert.equal(extrasForGarmentCents(garment, []), null);
});

test('live name previews preserve editable fields and hide unsupported personalized artwork', () => {
  const design = APPROVED_DESIGNS.find(item => item.id === 'number27')!;
  assert.equal(canPreviewDesign(validateDesigns([design])[0]), true);
  assert.equal(canPreviewDesign({ ...design, preview: undefined }), false);
  assert.equal(canPreviewDesign({ ...design, fields: [...design.fields, { id: 'other', label: 'Otro texto', maxLength: 18, required: false }] }), false);
  assert.throws(() => validateDesigns([{ ...design, preview: { recolorable: true, nameField: 'missing' } }]));
  for (const printColor of ['Amarillo fosforito', 'Rosa fosforito', 'Negro', 'Blanco', 'Azul claro']) {
    const saved = normalizePersonalizerSelection({ designStyle: design.id, designFields: { name: 'LUCÍA' }, printColor });
    const restored = normalizePersonalizerSelection(JSON.parse(JSON.stringify(saved)));
    assert.deepEqual(restored.designFields, { name: 'LUCÍA' });
    assert.equal(restored.printColor, printColor);
    assert.equal(restored.designStyle, 'number27');
  }
});

test('pending t-shirt never inherits hoodie photography', () => {
  const shirt = DEFAULT_CATALOG.find(product => product.category === 'tshirt');
  assert.ok(shirt?.quoteOnly);
  assert.equal(shirt?.colors.some(color => 'frontImage' in color || 'backImage' in color), false);
});
