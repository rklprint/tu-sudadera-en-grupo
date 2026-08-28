"use client";

import { useState, type FormEvent } from "react";

export type AdminCatalogProduct = {
  numericId: number;
  slug: string;
  category: "hoodie" | "tshirt";
  name: string;
  model: string;
  description: string;
  quoteOnly: boolean;
  active: boolean;
  featured: boolean;
  position: number;
  seoTitle: string;
  seoDescription: string;
  sizes: readonly string[];
  colors: readonly { name: string; value: string }[];
  priceTiers: readonly { min: number; max: number | null; label: string; unitPriceCents: number | null }[];
};

type Draft = {
  id: number | null;
  name: string;
  slug: string;
  category: "hoodie" | "tshirt";
  model: string;
  description: string;
  active: boolean;
  featured: boolean;
  quoteOnly: boolean;
  position: number;
  seoTitle: string;
  seoDescription: string;
  sizes: string;
  colors: string;
  priceTiers: string;
};

const emptyDraft = (): Draft => ({
  id: null,
  name: "",
  slug: "",
  category: "hoodie",
  model: "",
  description: "",
  active: false,
  featured: false,
  quoteOnly: true,
  position: 10,
  seoTitle: "",
  seoDescription: "",
  sizes: "S, M, L, XL, 2XL, 3XL",
  colors: "Negro: #202124\nBlanco: #f2f1ed",
  priceTiers: "",
});

function productDraft(product: AdminCatalogProduct): Draft {
  return {
    id: product.numericId,
    name: product.name,
    slug: product.slug,
    category: product.category,
    model: product.model,
    description: product.description,
    active: product.active,
    featured: product.featured,
    quoteOnly: product.quoteOnly,
    position: product.position,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    sizes: product.sizes.join(", "),
    colors: product.colors.map((color) => `${color.name}: ${color.value}`).join("\n"),
    priceTiers: product.priceTiers.map((tier) => `${tier.min}-${tier.max ?? ""}: ${tier.unitPriceCents === null ? "consultar" : (tier.unitPriceCents / 100).toFixed(2)}`).join("\n"),
  };
}

export function CatalogManager({ initialProducts }: { initialProducts: AdminCatalogProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => current ? { ...current, [key]: value } : current);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setNotice("");
    try {
      const colors = draft.colors.split("\n").map((line) => {
        const separator = line.lastIndexOf(":");
        return { name: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() };
      }).filter((color) => color.name && color.value);
      const priceTiers = draft.priceTiers.split("\n").map((line) => {
        const [range = "", rawPrice = ""] = line.split(":");
        const [minimum, maximum] = range.trim().split("-");
        const consult = /consultar/i.test(rawPrice);
        return { min: Number(minimum), max: maximum?.trim() ? Number(maximum) : null, label: "", unitPriceCents: consult ? null : Math.round(Number(rawPrice.trim().replace(",", ".")) * 100) };
      }).filter((tier) => Number.isFinite(tier.min));
      const product = {
        ...draft,
        sizes: draft.sizes.split(",").map((size) => size.trim()).filter(Boolean),
        colors,
        priceTiers,
      };
      const response = await fetch("/api/admin/catalogo", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft.id ? { id: draft.id, product } : product),
      });
      const result = await response.json() as { products?: AdminCatalogProduct[]; error?: string };
      if (!response.ok || !result.products) throw new Error(result.error || "No se ha podido guardar el producto.");
      setProducts(result.products);
      setDraft(null);
      setNotice("Catálogo actualizado. Los cambios públicos se sirven con una caché máxima de cinco minutos.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se ha podido guardar el producto.");
    } finally {
      setBusy(false);
    }
  };

  return <section className="catalog-manager">
    <header><div><p>Catálogo central</p><h2>Productos, variantes y tramos</h2><span>Los productos inactivos nunca aparecen en el personalizador público.</span></div><button type="button" onClick={() => setDraft(emptyDraft())}>+ Nuevo producto</button></header>
    {notice && <p className="admin-notice" role="status">{notice}</p>}
    <div className="catalog-product-list">{products.map((product) => <article key={product.numericId}>
      <div><span>{product.category === "hoodie" ? "Sudadera" : "Camiseta"}</span><h3>{product.name}</h3><p>{product.model} · {product.sizes.join(", ")}</p></div>
      <div className="catalog-state"><b>{product.active ? "Activo" : "Inactivo"}</b><small>{product.quoteOnly ? "Precio a consultar" : `${product.priceTiers.length} tramos publicados`}</small></div>
      <button type="button" onClick={() => setDraft(productDraft(product))}>Editar</button>
    </article>)}</div>

    {draft && <form className="catalog-form" onSubmit={save}>
      <header><div><span>{draft.id ? "Editar producto" : "Nuevo producto"}</span><h3>{draft.name || "Sin nombre"}</h3></div><button type="button" onClick={() => setDraft(null)} aria-label="Cerrar editor">×</button></header>
      <div className="catalog-fields">
        <label><span>Nombre</span><input required maxLength={80} value={draft.name} onChange={(event) => update("name", event.target.value)} /></label>
        <label><span>Slug</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={draft.slug} onChange={(event) => update("slug", event.target.value.toLowerCase())} /></label>
        <label><span>Categoría</span><select value={draft.category} onChange={(event) => update("category", event.target.value as Draft["category"])}><option value="hoodie">Sudadera</option><option value="tshirt">Camiseta</option></select></label>
        <label><span>Modelo</span><input required maxLength={90} value={draft.model} onChange={(event) => update("model", event.target.value)} /></label>
        <label className="wide"><span>Descripción</span><textarea rows={3} maxLength={700} value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
        <label className="wide"><span>Tallas separadas por comas</span><input required value={draft.sizes} onChange={(event) => update("sizes", event.target.value)} /></label>
        <label className="wide"><span>Colores · uno por línea: Nombre: #hex</span><textarea required rows={5} value={draft.colors} onChange={(event) => update("colors", event.target.value)} /></label>
        <label className="wide"><span>Tramos · uno por línea: mínimo-máximo: precio; máximo vacío para “+”</span><textarea rows={6} disabled={draft.quoteOnly} value={draft.priceTiers} onChange={(event) => update("priceTiers", event.target.value)} placeholder={"5-10: 30\n11-20: 28\n101-: consultar"} /></label>
        <label className="wide"><span>Título SEO</span><input maxLength={70} value={draft.seoTitle} onChange={(event) => update("seoTitle", event.target.value)} /></label>
        <label className="wide"><span>Descripción SEO</span><textarea rows={2} maxLength={170} value={draft.seoDescription} onChange={(event) => update("seoDescription", event.target.value)} /></label>
        <label><span>Orden</span><input type="number" min="0" max="999" value={draft.position} onChange={(event) => update("position", Number(event.target.value))} /></label>
      </div>
      <div className="catalog-toggles"><label><input type="checkbox" checked={draft.active} onChange={(event) => update("active", event.target.checked)} /><span>Producto activo</span></label><label><input type="checkbox" checked={draft.featured} onChange={(event) => update("featured", event.target.checked)} /><span>Destacado</span></label><label><input type="checkbox" checked={draft.quoteOnly} onChange={(event) => update("quoteOnly", event.target.checked)} /><span>Precio a consultar</span></label></div>
      <footer><button type="button" onClick={() => setDraft(null)}>Cancelar</button><button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar producto"}</button></footer>
    </form>}
  </section>;
}
