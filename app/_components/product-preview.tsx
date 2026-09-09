"use client";

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { CatalogColor, CatalogProduct } from '@/lib/catalog';
import type { CatalogDesign } from '@/lib/customization-catalog';

/** Only exact product/color/view assets; never substitute a different garment. */
type ProductPreviewOverlay = {
  frontType: 'coordinates' | 'logo' | 'name';
  frontText: string;
  backLines: string[];
  printColor: string;
};

export function ProductPreview({ product, color, side, design, summary, overlay, onLoad }: {
  product: CatalogProduct; color: CatalogColor; side: 'front' | 'back';
  design?: CatalogDesign; summary: string; overlay: ProductPreviewOverlay; onLoad: () => void;
}) {
  const variant = product.colors.find(item => item.name === color.name && item.value === color.value);
  const src = side === 'front' ? variant?.frontImage : variant?.backImage;
  const [failed, setFailed] = useState('');
  const [failedDesign, setFailedDesign] = useState('');
  const visibleDesign = design?.active && design.view === side && design.products.includes(product.slug) && design.file !== failedDesign;
  const printStyle = { '--preview-print': overlay.printColor } as CSSProperties;
  return <div className="product-preview-frame" style={printStyle}>
    {src && failed !== src ? <>
      <Image unoptimized src={src} alt={`${product.model} · ${color.name} · ${side === 'front' ? 'Delante' : 'Espalda'}`} width={2000} height={2000} loading="eager" sizes="(max-width: 700px) 94vw, 620px" onLoad={onLoad} onError={() => { setFailed(src); onLoad(); }} />
      {visibleDesign && <Image unoptimized src={design.file} alt={design.name} width={1000} height={1000} onError={() => setFailedDesign(design.file)} style={{ position: 'absolute', left: `${design.position.x}%`, top: `${design.position.y}%`, width: `${design.size.width}%`, height: `${design.size.height}%`, objectFit: 'contain' }} />}
      {side === 'front' && !visibleDesign && overlay.frontType !== 'logo' && overlay.frontText && <div className={`product-preview-print-mark front ${overlay.frontType}`} aria-hidden="true">{overlay.frontText}</div>}
      <span className="product-preview-orientation">Vista orientativa</span>
    </> : <div className="product-preview-empty" role="status"><strong>{product.model}</strong><span>{color.name} · {side === 'front' ? 'Delante' : 'Espalda'}</span><p>Imagen de esta variante pendiente.</p></div>}
    <span className="sr-only">{summary}</span>
  </div>;
}


/** Catalog artwork only: no synthetic thumbnail when the file is unavailable. */
export function DesignThumbnail({ design }: { design: CatalogDesign }) {
  const [failed, setFailed] = useState("");
  return failed === design.file
    ? <span className="design-thumbnail-missing">Imagen pendiente</span>
    : <Image className="design-thumbnail" unoptimized src={design.file} alt={design.name} width={400} height={400} loading="lazy" onError={() => setFailed(design.file)} />;
}
