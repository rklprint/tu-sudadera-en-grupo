"use client";

import Image from 'next/image';
import { useState } from 'react';
import type { CatalogColor, CatalogProduct } from '@/lib/catalog';
import type { CatalogDesign } from '@/lib/customization-catalog';

/** Only exact product/color/view assets; never substitute a different garment. */
export function ProductPreview({ product, color, side, design, summary, onLoad }: {
  product: CatalogProduct; color: CatalogColor; side: 'front' | 'back';
  design?: CatalogDesign; summary: string; onLoad: () => void;
}) {
  const variant = product.colors.find(item => item.name === color.name && item.value === color.value);
  const src = side === 'front' ? variant?.frontImage : variant?.backImage;
  const [failed, setFailed] = useState('');
  const [failedDesign, setFailedDesign] = useState('');
  const visibleDesign = design?.active && design.view === side && design.products.includes(product.slug) && design.file !== failedDesign;
  return <div className="product-preview-frame">
    {src && failed !== src ? <>
      <Image unoptimized src={src} alt={`${product.model} · ${color.name} · ${side === 'front' ? 'Delante' : 'Espalda'}`} width={2000} height={2000} sizes="(max-width: 700px) 94vw, 620px" onLoad={onLoad} onError={() => { setFailed(src); onLoad(); }} />
      {visibleDesign && <Image unoptimized src={design.file} alt={design.name} width={1000} height={1000} onError={() => setFailedDesign(design.file)} style={{ position: 'absolute', left: `${design.position.x}%`, top: `${design.position.y}%`, width: `${design.size.width}%`, height: `${design.size.height}%`, objectFit: 'contain' }} />}
    </> : <div className="product-preview-empty" role="status"><strong>{product.model}</strong><span>{color.name} · {side === 'front' ? 'Delante' : 'Espalda'}</span><p>Imagen de esta variante pendiente.</p></div>}
    <span className="sr-only">{summary}</span>
  </div>;
}
