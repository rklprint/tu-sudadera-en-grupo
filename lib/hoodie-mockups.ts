/** Owner-supplied WebP pairs, September 2026. Stable color ids preserve saved selections. */
export const HOODIE_MOCKUPS = [
  { slug: 'granate', file: 'granate', swatch: '#9c1122', legacyFront: 1, legacyBack: 1 },
  { slug: 'azul-cielo', file: 'azul-cielo', swatch: '#6dacf1', legacyFront: 2, legacyBack: 9 },
  { slug: 'rosa', file: 'rosa', swatch: '#f7a7c9', legacyFront: 3, legacyBack: 8 },
  { slug: 'azul-petroleo', file: 'azul-petroleo', swatch: '#435c79', legacyFront: 4, legacyBack: 4 },
  { slug: 'azul-marino', file: 'azul-marino', swatch: '#113271', legacyFront: 5, legacyBack: 5 },
  { slug: 'gris', file: 'gris-oscuro', swatch: '#545255', legacyFront: 6, legacyBack: 7 },
  { slug: 'verde-oliva', file: 'verde-oliva', swatch: '#336233', legacyFront: 7, legacyBack: 3 },
  { slug: 'verde-botella', file: 'verde-botella', swatch: '#1b4629', legacyFront: 8, legacyBack: 2 },
  { slug: 'negro', file: 'negro', swatch: '#242424', legacyFront: 9, legacyBack: 6 },
] as const;

export function hoodieMockupPath(file: string, side: 'front' | 'back') {
  return `/products/gildan-18500/definitive/sudadera-${side === 'front' ? 'frontal-lazo' : 'espalda'}-${file}.webp`;
}

/** Upgrade only known legacy photography; custom managed assets remain untouched. */
export function currentHoodieMockup(src: string | undefined, side: 'front' | 'back') {
  const pair = HOODIE_MOCKUPS.find(item => src === `/products/gildan-18500/color-${side === 'front' ? item.legacyFront : item.legacyBack}/${side}.webp`);
  return pair ? hoodieMockupPath(pair.file, side) : src;
}

export function isDefinitiveHoodieMockup(src: string | undefined, side: 'front' | 'back') {
  return HOODIE_MOCKUPS.some(pair => src === hoodieMockupPath(pair.file, side));
}

/** Swatch sampled from the supplied front torso; identity values stay stable. */
export function hoodieMockupSwatch(src: string | undefined, fallback: string) {
  return HOODIE_MOCKUPS.find(pair => src === hoodieMockupPath(pair.file, 'front'))?.swatch ?? fallback;
}
