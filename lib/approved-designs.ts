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
  position: { x: 33, y: 34 },
  size: { width: 34, height: 45 },
  products: ['sudadera-gildan-18500'],
  personalizable: false, fields: [], active: true, order,
}));

/** Existing managed catalogs, including deliberately inactive entries, win. */
export function designsForProduct(slug: string, model: string, managed: CatalogDesign[]): CatalogDesign[] {
  return managed.length || slug !== 'sudadera-gildan-18500' || model !== 'Gildan 18500'
    ? managed
    : structuredClone(APPROVED_DESIGNS);
}
