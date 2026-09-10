export type SleeveSelection = {
  type: 'none' | 'spain' | 'community' | 'country' | 'custom';
  detail: string;
  technique: 'print' | 'embroidery';
};

// Public artwork only. No customer uploads, prices, or commercial rules here.
export const SLEEVE_FLAGS = [
  { id: 'espana', name: 'España', type: 'spain', file: '/flags/espana.svg', aliases: ['España'] },
  { id: 'andalucia', name: 'Andalucía', type: 'community', file: '/flags/andalucia.svg', aliases: ['Andalucía'] },
  { id: 'cataluna', name: 'Cataluña', type: 'community', file: '/flags/cataluna.svg', aliases: ['Cataluña', 'Catalunya'] },
  { id: 'galicia', name: 'Galicia', type: 'community', file: '/flags/galicia.svg', aliases: ['Galicia'] },
  { id: 'pais-vasco', name: 'País Vasco', type: 'community', file: '/flags/pais-vasco.svg', aliases: ['País Vasco', 'Euskadi'] },
  { id: 'francia', name: 'Francia', type: 'country', file: '/flags/francia.svg', aliases: ['Francia', 'France'] },
  { id: 'portugal', name: 'Portugal', type: 'country', file: '/flags/portugal.svg', aliases: ['Portugal'] },
] as const;

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

export function resolveSleeveFlag(selection: SleeveSelection) {
  return SLEEVE_FLAGS.find(flag => flag.type === selection.type && (
    selection.type === 'spain' || flag.aliases.some(alias => normalize(alias) === normalize(selection.detail))
  ));
}

// Calibrated for the existing normalized Gildan image pairs only.
// The same physical sleeve is on opposite sides when the garment turns.
export function sleevePlacement(productSlug: string, src: string | undefined, side: 'front' | 'back') {
  if (productSlug !== 'sudadera-gildan-18500' || !src || !new RegExp(`^/products/gildan-18500/color-[1-9]/${side}\\.webp$`).test(src)) return undefined;
  return side === 'back'
    ? { x: 72.5, y: 45, width: 5.5, rotation: -14 }
    : { x: 27, y: 51, width: 5.5, rotation: 14 };
}
