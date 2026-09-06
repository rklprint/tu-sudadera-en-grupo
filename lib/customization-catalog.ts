/** Commercial amounts are preserved from the existing implementation. */
export type CatalogExtra = {
  id: string; name: string; priceCents: number | null;
  products: string[]; position: 'front' | 'back' | 'sleeve' | 'other';
  type: 'dtf' | 'embroidery' | 'text'; active: boolean;
  requiresText: boolean; requiresFile: boolean; perGarment: boolean; order: number;
};
export const DEFAULT_EXTRAS: CatalogExtra[] = [
  { id: 'pecho-coordenadas-bordadas', name: 'Coordenadas bordadas', priceCents: 100, position: 'front', type: 'embroidery', requiresText: true, requiresFile: false },
  { id: 'manga-dtf', name: 'Bandera o logo DTF', priceCents: 100, position: 'sleeve', type: 'dtf', requiresText: true, requiresFile: false },
  { id: 'manga-bandera-bordada', name: 'Bandera bordada', priceCents: 200, position: 'sleeve', type: 'embroidery', requiresText: true, requiresFile: false },
  { id: 'pecho-logo-bordado', name: 'Logo bordado propio', priceCents: null, position: 'front', type: 'embroidery', requiresText: true, requiresFile: false },
  { id: 'manga-logo-bordado', name: 'Logo bordado propio', priceCents: null, position: 'sleeve', type: 'embroidery', requiresText: true, requiresFile: false },
].map((extra, order) => ({ ...extra, products: ['sudadera-gildan-18500'], active: true, perGarment: true, order })) as CatalogExtra[];

export type CatalogDesign = {
  id: string; name: string; file: string; view: 'front' | 'back';
  position: { x: number; y: number }; size: { width: number; height: number };
  products: string[]; personalizable: boolean;
  fields: { id: string; label: string; maxLength: number; required: boolean }[];
  active: boolean; order: number;
};

export function extraPrice(id: string, extras: readonly CatalogExtra[] = DEFAULT_EXTRAS): number | null {
  const extra = extras.find(item => item.id === id && item.active);
  return extra?.perGarment ? extra.priceCents : null;
}

export function publicAssetPath(value: unknown, kind: 'product' | 'design'): string {
  if (!value) return '';
  const path = String(value);
  const prefix = kind === 'product' ? '/products/' : '/designs/';
  if (!path.startsWith(prefix) || path.includes('..') || !/^\/[a-zA-Z0-9/_-]+\.(png|webp|avif|jpg|jpeg|svg)$/.test(path) || (kind === 'product' && path.endsWith('.svg'))) {
    throw new Error('Usa una ruta pública de producto o diseño válida; nunca un archivo privado de cliente.');
  }
  return path;
}

export function validateDesigns(value: unknown): CatalogDesign[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 100) throw new Error('Catálogo de diseños inválido.');
  const ids = new Set<string>();
  return value.map((design: CatalogDesign) => {
    if (!design || !/^[a-z0-9-]{1,80}$/.test(design.id) || ids.has(design.id) || !design.name?.trim() || !['front', 'back'].includes(design.view)) throw new Error('Identidad o vista del diseño inválida.');
    ids.add(design.id);
    for (const n of [design.position?.x, design.position?.y, design.size?.width, design.size?.height]) if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error('Posición y tamaño deben estar entre 0 y 100 %.');
    if (!design.size.width || !design.size.height || design.position.x + design.size.width > 100 || design.position.y + design.size.height > 100) throw new Error('El diseño debe quedar dentro del lienzo.');
    if (!Array.isArray(design.products) || !design.products.length || design.products.some(p => typeof p !== 'string' || !/^[a-z0-9-]+$/.test(p))) throw new Error('Define productos compatibles.');
    if (!Array.isArray(design.fields) || design.fields.length > 10 || design.fields.some(f => !/^[a-z0-9-]+$/.test(f.id) || !f.label || !Number.isInteger(f.maxLength) || f.maxLength < 1 || f.maxLength > 500)) throw new Error('Campos personalizables inválidos.');
    const file = publicAssetPath(design.file, 'design');
    if (design.active && !file) throw new Error('Un diseño activo necesita archivo.');
    return { ...design, name: design.name.trim().slice(0, 100), file, active: design.active === true, personalizable: design.personalizable === true, order: Number.isInteger(design.order) ? design.order : 0 };
  });
}
