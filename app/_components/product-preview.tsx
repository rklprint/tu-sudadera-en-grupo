"use client";

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { CatalogColor, CatalogProduct } from '@/lib/catalog';
import type { CatalogDesign } from '@/lib/customization-catalog';
import { resolveSleeveFlag, sleevePlacement, type SleeveSelection } from '@/lib/sleeve-preview';

/** Only exact product/color/view assets; never substitute a different garment. */
type ProductPreviewOverlay = {
  frontType: 'coordinates' | 'logo' | 'name';
  frontText: string;
  backLines: string[];
  printColor: string;
};

export function ProductPreview({ product, color, side, design, summary, overlay, sleeve, onLoad }: {
  product: CatalogProduct; color: CatalogColor; side: 'front' | 'back';
  design?: CatalogDesign; summary: string; overlay: ProductPreviewOverlay; sleeve?: SleeveSelection; onLoad: () => void;
}) {
  const variant = product.colors.find(item => item.name === color.name && item.value === color.value);
  const src = side === 'front' ? variant?.frontImage : variant?.backImage;
  const [failed, setFailed] = useState('');
  const [failedDesign, setFailedDesign] = useState('');
  const [failedFlag, setFailedFlag] = useState('');
  const flag = sleeve && resolveSleeveFlag(sleeve);
  const placement = sleevePlacement(product.slug, src, side);
  const showFlag = flag && placement && src && failed !== src && failedFlag !== flag.file;
  const visibleDesign = design?.active && design.view === side && design.products.includes(product.slug) && design.file !== failedDesign;
  const printStyle = { '--preview-print': overlay.printColor } as CSSProperties;
  return <div className="product-preview-frame" style={printStyle}>
    {src && failed !== src ? <>
      <Image unoptimized src={src} alt={`${product.model} · ${color.name} · ${side === 'front' ? 'Delante' : 'Espalda'}`} width={2000} height={2000} loading="eager" sizes="(max-width: 700px) 94vw, 620px" onLoad={onLoad} onError={() => { setFailed(src); onLoad(); }} />
      {visibleDesign && <Image unoptimized src={design.file} alt={design.name} width={1000} height={1000} onError={() => setFailedDesign(design.file)} style={{ position: 'absolute', left: `${design.position.x}%`, top: `${design.position.y}%`, width: `${design.size.width}%`, height: `${design.size.height}%`, objectFit: 'contain' }} />}
      {side === 'front' && !visibleDesign && overlay.frontType !== 'logo' && overlay.frontText && <div className={`product-preview-print-mark front ${overlay.frontType}`} aria-hidden="true">{overlay.frontText}</div>}
      {showFlag && <span className={`product-preview-sleeve ${sleeve?.technique}`} style={{ left: `${placement.x}%`, top: `${placement.y}%`, width: `${placement.width}%`, transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)` }}>
        <Image unoptimized src={flag.file} alt={`Bandera de ${flag.name} en manga · ${sleeve?.technique === 'embroidery' ? 'bordada' : 'estampada'} · posición orientativa`} width={90} height={60} onError={() => setFailedFlag(flag.file)} />
      </span>}
      <span className="product-preview-orientation">Vista orientativa</span>
    </> : <div className="product-preview-empty" role="status"><strong>{product.model}</strong><span>{color.name} · {side === 'front' ? 'Delante' : 'Espalda'}</span><p>Imagen de esta variante pendiente.</p></div>}
    <span className="sr-only">{summary}</span>
    {sleeve && sleeve.type !== 'none' && !showFlag && <span className="sr-only" role="status">Manga: {sleeve.detail || (sleeve.type === 'custom' ? 'logo propio' : 'bandera')} · montaje pendiente.</span>}
  </div>;
}


/** Catalog artwork only: no synthetic thumbnail when the file is unavailable. */
export function DesignThumbnail({ design }: { design: CatalogDesign }) {
  const [failed, setFailed] = useState("");
  return failed === design.file
    ? <span className="design-thumbnail-missing">Imagen pendiente</span>
    : <Image className="design-thumbnail" unoptimized src={design.file} alt={design.name} width={400} height={400} loading="lazy" onError={() => setFailed(design.file)} />;
}
