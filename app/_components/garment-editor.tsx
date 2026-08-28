"use client";

import { trackProductEvent } from "@/lib/analytics";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export type GarmentDraft = {
  printName: string;
  size: string;
  namePlacement: "front" | "back";
  frontExtra: "none" | "coordinates" | "custom_embroidery";
  frontDetail: string;
  sleeveExtra: "none" | "dtf_flag" | "embroidered_flag" | "custom_embroidery";
  sleeveDetail: string;
};

export const newGarment = (): GarmentDraft => ({
  printName: "",
  size: "M",
  namePlacement: "front",
  frontExtra: "none",
  frontDetail: "",
  sleeveExtra: "none",
  sleeveDetail: "",
});

type Props = {
  garments: GarmentDraft[];
  onChange: (garments: GarmentDraft[]) => void;
  unitPriceCents: number;
  model?: string;
  disabled?: boolean;
};

export function GarmentEditor({ garments, onChange, unitPriceCents, model = "Gildan 18500", disabled = false }: Props) {
  const productLabel = /camiseta/i.test(model) || /por confirmar/i.test(model) ? "camiseta" : "sudadera";
  const update = (index: number, field: keyof GarmentDraft, value: string) => {
    onChange(garments.map((garment, itemIndex) => {
      if (itemIndex !== index) return garment;
      const next = { ...garment, [field]: value } as GarmentDraft;
      if (field === "frontExtra" && value !== garment.frontExtra) next.frontDetail = "";
      if (field === "sleeveExtra" && value !== garment.sleeveExtra) next.sleeveDetail = "";
      return next;
    }));
    if (field === "size") void trackProductEvent("talla_selected", { size: value, product_type: productLabel === "camiseta" ? "tshirt" : "hoodie" });
    if (field === "frontExtra" || field === "sleeveExtra") {
      void trackProductEvent("personalizacion_added", {
        product_type: productLabel === "camiseta" ? "tshirt" : "hoodie",
        placement: field === "frontExtra" ? "front" : "sleeve",
        extra_type: value,
      });
    }
  };

  const remove = (index: number) => {
    if (garments.length > 1) {
      onChange(garments.filter((_, itemIndex) => itemIndex !== index));
      toast.success("Prenda eliminada", { description: "El resto de configuraciones no ha cambiado." });
    }
  };

  const add = () => {
    onChange([...garments, newGarment()]);
    toast.success("Prenda añadida", { description: "Podéis elegir su talla, nombre y extras de forma independiente." });
  };

  return <div className="garment-editor">
    <div className="garment-editor-head">
      <div><span>Prendas independientes</span><strong>{garments.length} {garments.length === 1 ? productLabel : `${productLabel}s`}</strong></div>
      <button type="button" disabled={disabled || garments.length >= 12} onClick={add}><Plus aria-hidden="true" /> Añadir otra</button>
    </div>

    <div className="garment-list">
      {garments.map((garment, index) => {
        const customPrice = garment.frontExtra === "custom_embroidery" || garment.sleeveExtra === "custom_embroidery";
        const extras = (garment.frontExtra === "coordinates" ? 100 : 0) + (garment.sleeveExtra === "dtf_flag" ? 100 : garment.sleeveExtra === "embroidered_flag" ? 200 : 0);
        return <article className="garment-card" key={index}>
          <header><div><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{productLabel[0].toUpperCase() + productLabel.slice(1)} {index + 1}</strong><small>{model} · personalización según presupuesto aprobado</small></div></div>{garments.length > 1 && <button type="button" disabled={disabled} onClick={() => remove(index)} aria-label={`Eliminar ${productLabel} ${index + 1}`}><Trash2 aria-hidden="true" /> Eliminar</button>}</header>
          <div className="garment-fields">
            <label className="wide"><span>Nombre que irá impreso</span><input required disabled={disabled} value={garment.printName} onChange={event => update(index, "printName", event.target.value)} maxLength={40} placeholder="Ej. Lucía" /></label>
            <label><span>Talla</span><select disabled={disabled} value={garment.size} onChange={event => update(index, "size", event.target.value)}>{["S", "M", "L", "XL", "2XL", "3XL"].map(size => <option key={size}>{size}</option>)}</select></label>
            <label><span>Nombre colocado en</span><select disabled={disabled} value={garment.namePlacement} onChange={event => update(index, "namePlacement", event.target.value)}><option value="front">Pecho</option><option value="back">Espalda</option></select></label>
            <label><span>Extra en pecho</span><select disabled={disabled} value={garment.frontExtra} onChange={event => update(index, "frontExtra", event.target.value)}><option value="none">Sin extra</option><option value="coordinates">Coordenadas bordadas · +1 €</option><option value="custom_embroidery">Logo bordado propio · consultar</option></select></label>
            <label><span>Extra en manga</span><select disabled={disabled} value={garment.sleeveExtra} onChange={event => update(index, "sleeveExtra", event.target.value)}><option value="none">Sin extra</option><option value="dtf_flag">Bandera o logo DTF · +1 €</option><option value="embroidered_flag">Bandera bordada · +2 €</option><option value="custom_embroidery">Logo bordado propio · consultar</option></select></label>
            {garment.frontExtra !== "none" && <label className="wide"><span>{garment.frontExtra === "coordinates" ? "Coordenadas exactas" : "Qué logotipo irá en el pecho"}</span><input required disabled={disabled} value={garment.frontDetail} onChange={event => update(index, "frontDetail", event.target.value)} maxLength={100} placeholder={garment.frontExtra === "coordinates" ? "Ej. 40°25′N · 3°42′O" : "Describe el logo o su referencia"} /></label>}
            {garment.sleeveExtra !== "none" && <label className="wide"><span>{garment.sleeveExtra === "custom_embroidery" ? "Qué logotipo irá en la manga" : "Bandera o detalle exacto"}</span><input required disabled={disabled} value={garment.sleeveDetail} onChange={event => update(index, "sleeveDetail", event.target.value)} maxLength={100} placeholder={garment.sleeveExtra === "custom_embroidery" ? "Describe el logo o su referencia" : "Ej. España, Madrid, Andalucía, Portugal…"} /></label>}
          </div>
          <footer><span>Precio de esta prenda</span><strong>{customPrice ? "A consultar" : `${((unitPriceCents + extras) / 100).toFixed(2).replace(".00", "").replace(".", ",")} €`}</strong></footer>
        </article>;
      })}
    </div>
  </div>;
}
