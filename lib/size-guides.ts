/** Gildan Europe Style & Colour Guide 2025, pp. 16–17, row 18000/18500.
 * Published centimetres, not body circumferences or inch conversions.
 * Checked 2026-09-16. See docs/SIZE-GUIDE.md for provenance.
 */
export const GILDAN_18500_SIZE_GUIDE = {
  model: 'Gildan 18500',
  source: 'https://online.flippingbook.com/view/330927628',
  measurements: [
    { size: 'S', widthCm: 51, lengthCm: 69 },
    { size: 'M', widthCm: 56, lengthCm: 71 },
    { size: 'L', widthCm: 61, lengthCm: 74 },
    { size: 'XL', widthCm: 66, lengthCm: 76 },
    { size: '2XL', widthCm: 71, lengthCm: 79 },
    { size: '3XL', widthCm: 76, lengthCm: 81 },
  ],
} as const;

/** Gildan Europe 2025, p. 16, row 2000/2400; published centimetres. */
export const GILDAN_2000_SIZE_GUIDE = {
  model: 'Gildan 2000',
  source: 'https://online.flippingbook.com/view/330927628',
  measurements: [
    { size: 'S', widthCm: 46, lengthCm: 71 },
    { size: 'M', widthCm: 51, lengthCm: 74 },
    { size: 'L', widthCm: 56, lengthCm: 76 },
    { size: 'XL', widthCm: 61, lengthCm: 79 },
    { size: '2XL', widthCm: 66, lengthCm: 81 },
    { size: '3XL', widthCm: 71, lengthCm: 84 },
  ],
} as const;
