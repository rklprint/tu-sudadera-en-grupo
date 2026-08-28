"use client";

import { Drawer } from "vaul";
import { ArrowUpRight, Layers3, Palette, Shirt, Sparkles, X } from "lucide-react";

type Props = {
  product: string;
  model: string;
  color: string;
  design: string;
  sleeve: string;
  quantity: number;
  price: string;
  onQuote: () => void;
};

export function CustomizerDrawer({ product, model, color, design, sleeve, quantity, price, onQuote }: Props) {
  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <button className="mobile-customizer-trigger" type="button">
          <span><small>Vuestra configuración</small><strong>{price}</strong></span>
          <b>Ver resumen <ArrowUpRight aria-hidden="true" /></b>
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="customizer-drawer-overlay" />
        <Drawer.Content className="customizer-drawer-content" aria-describedby="customizer-drawer-description">
          <div className="customizer-drawer-handle" aria-hidden="true" />
          <div className="customizer-drawer-heading">
            <div>
              <span>Configuración actual</span>
              <Drawer.Title>Todo listo para revisar</Drawer.Title>
              <Drawer.Description id="customizer-drawer-description">
                El presupuesto conservará estas opciones. No se realizará ningún cobro ahora.
              </Drawer.Description>
            </div>
            <Drawer.Close asChild>
              <button type="button" aria-label="Cerrar resumen"><X aria-hidden="true" /></button>
            </Drawer.Close>
          </div>
          <div className="customizer-drawer-summary">
            <div><Shirt aria-hidden="true" /><span><small>Prenda</small><strong>{product} · {model}</strong></span></div>
            <div><Palette aria-hidden="true" /><span><small>Color</small><strong>{color}</strong></span></div>
            <div><Layers3 aria-hidden="true" /><span><small>Diseño</small><strong>{design}</strong></span></div>
            <div><Sparkles aria-hidden="true" /><span><small>Manga</small><strong>{sleeve}</strong></span></div>
          </div>
          <div className="customizer-drawer-total">
            <span><small>{quantity} unidades</small><strong>{price}</strong></span>
            <small>Precio por unidad · IVA incluido</small>
          </div>
          <Drawer.Close asChild>
            <button className="customizer-drawer-quote" type="button" onClick={onQuote}>
              Pedir presupuesto <ArrowUpRight aria-hidden="true" />
            </button>
          </Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
