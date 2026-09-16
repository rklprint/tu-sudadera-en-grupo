import type { CatalogDesign } from './customization-catalog';

/** Owner-supplied artwork, 2026-09-16. Adaptations are approved in the proof. */
export const APPROVED_DESIGNS: CatalogDesign[] = [
  ['x', 'X con nombres'],
  ['number27', 'Número 27'],
  ['number10', 'Número 10'],
  ['colegas', 'Los colegas del pueblo'],
  ['torredonjimeno', 'Torredonjimeno en fiestas'],
  ['tarragona', 'Tarragona en festa'],
].map(([id, name], order) => ({
  id, name,
  file: `/designs/approved/${id}.webp`,
  thumbnail: `/designs/approved/${id}-thumb.webp`,
  view: 'back',
  position: { x: 36, y: 35 },
  size: { width: 28, height: 34 },
  products: ['sudadera-gildan-18500', 'camiseta-personalizada'],
  preview: { recolorable: true, ...(['x', 'number27', 'number10'].includes(id) ? { nameField: 'name' } : {}) },
  personalizable: ['x', 'number27', 'number10'].includes(id),
  fields: ['x', 'number27', 'number10'].includes(id)
    ? [{ id: 'name', label: 'Nombre sobre el número o la X', maxLength: 18, required: false }]
    : [],
  active: true, order,
}));

/** Existing managed catalogs, including deliberately inactive entries, win. */
export function designsForProduct(slug: string, model: string, managed: CatalogDesign[]): CatalogDesign[] {
  const supported = (slug === 'sudadera-gildan-18500' && model === 'Gildan 18500')
    || (slug === 'camiseta-personalizada' && model === 'Gildan 2000');
  return managed.length || !supported
    ? managed
    : structuredClone(APPROVED_DESIGNS);
}
