"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { FlowFooter, FlowHeader, FlowSteps } from "@/app/_components/flow-shell";
import { trackProductEvent } from "@/lib/analytics";
import type { PersonalizerSelection } from "@/lib/commercial";

const groupTypes = [
  "Colegio o instituto",
  "Universidad o promoción",
  "Peña o fiestas",
  "Equipo o club",
  "Viaje o evento",
  "Grupo de amigos",
  "Otro",
];

type Configuration = PersonalizerSelection & {
  basePrice: string;
  configuredPrice: string;
};

const defaultConfiguration: Configuration = {
  productSlug: "sudadera-gildan-18500",
  productCategory: "hoodie",
  product: "Sudadera",
  model: "Gildan 18500",
  color: "Por elegir",
  printColor: "Por elegir",
  designPath: "template",
  designStyle: "x",
  backDesign: "Idea por definir",
  groupName: "Vuestro grupo",
  frontType: "coordinates",
  frontText: "",
  frontTechnique: "print",
  frontDesign: "Por definir",
  sleeveFlag: "none",
  sleeveDetail: "",
  sleeveTechnique: "print",
  sleeve: "Sin decidir",
  basePrice: "Según cantidad",
  configuredPrice: "Según configuración",
};

function QuotePageContent() {
  const router = useRouter();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const query = useSearchParams();
  const queriedGroupType = query.get("groupType");
  const configuration: Configuration = {
    productSlug: query.get("productSlug") || defaultConfiguration.productSlug,
    productCategory: query.get("productCategory") === "tshirt" ? "tshirt" : "hoodie",
    product: query.get("product") || defaultConfiguration.product,
    model: query.get("model") || defaultConfiguration.model,
    color: query.get("color") || defaultConfiguration.color,
    printColor: query.get("printColor") || defaultConfiguration.printColor,
    designPath: query.get("designPath") === "upload" ? "upload" : query.get("designPath") === "studio" ? "studio" : "template",
    designStyle: query.get("designStyle") || defaultConfiguration.designStyle,
    backDesign: query.get("backDesign") || defaultConfiguration.backDesign,
    groupName: query.get("groupName") || defaultConfiguration.groupName,
    frontType: query.get("frontType") === "logo" ? "logo" : query.get("frontType") === "name" ? "name" : "coordinates",
    frontText: query.get("frontText") || "",
    frontTechnique: query.get("frontTechnique") === "embroidery" ? "embroidery" : "print",
    frontDesign: query.get("frontDesign") || defaultConfiguration.frontDesign,
    sleeveFlag: ["spain", "community", "country", "custom"].includes(query.get("sleeveFlag") || "") ? query.get("sleeveFlag") as Configuration["sleeveFlag"] : "none",
    sleeveDetail: query.get("sleeveDetail") || "",
    sleeveTechnique: query.get("sleeveTechnique") === "embroidery" ? "embroidery" : "print",
    sleeve: query.get("sleeve") || defaultConfiguration.sleeve,
    basePrice: query.get("basePrice") || defaultConfiguration.basePrice,
    configuredPrice: query.get("configuredPrice") || defaultConfiguration.configuredPrice,
  };
  const queriedQuantity = Number(query.get("quantity"));
  const [form, setForm] = useState({
    organizerName: "",
    phone: "",
    email: "",
    groupName: configuration.groupName === defaultConfiguration.groupName ? "" : configuration.groupName,
    groupType: groupTypes.includes(queriedGroupType || "")
      ? queriedGroupType as string
      : groupTypes[0],
    location: "",
    quantity: Number.isFinite(queriedQuantity) && queriedQuantity >= 5 ? Math.min(500, Math.round(queriedQuantity)) : 25,
    desiredDate: "",
    notes: "",
    referenceUrl: "",
    privacyAccepted: false,
    website: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [designFile, setDesignFile] = useState<File | null>(null);

  useEffect(() => {
    void trackProductEvent("presupuesto_started", {
      product_type: configuration.product.toLowerCase().includes("camiseta") ? "tshirt" : "hoodie",
      model: configuration.model,
      source: query.get("product") ? "personalizador" : "direct",
    });
  // This event intentionally runs once per form visit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError("");

    try {
      const body = new FormData();
      body.set("organizerName", form.organizerName);
      body.set("phone", form.phone);
      body.set("email", form.email);
      body.set("groupName", form.groupName);
      body.set("groupType", form.groupType);
      body.set("location", form.location);
      body.set("quantity", String(form.quantity));
      body.set("desiredDate", form.desiredDate);
      body.set("notes", form.notes);
      body.set("referenceUrl", form.referenceUrl);
      body.set("privacyAccepted", String(form.privacyAccepted));
      body.set("website", form.website);
      body.set("configuration", JSON.stringify({ ...configuration, groupName: form.groupName }));
      if (designFile) body.set("designFile", designFile);
      const response = await fetch("/api/presupuestos", {
        method: "POST",
        body,
      });
      const result = await response.json() as { code?: string; emailStatus?: string; error?: string };
      if (!response.ok || !result.code) throw new Error(result.error || "No hemos podido enviar la solicitud.");
      await trackProductEvent("presupuesto_submitted", {
        product_type: configuration.product.toLowerCase().includes("camiseta") ? "tshirt" : "hoodie",
        quantity: form.quantity,
        group_type: form.groupType,
      });
      router.push(`/presupuesto/recibido?ref=${encodeURIComponent(result.code)}&mail=${encodeURIComponent(result.emailStatus || "pending")}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No hemos podido enviar la solicitud.");
      setSending(false);
    }
  };

  const summary = [
    ["Producto", configuration.product],
    ["Modelo", configuration.model],
    ["Color", configuration.color],
    ["Espalda", configuration.backDesign],
    ["Delantera", configuration.frontDesign],
    ["Manga", configuration.sleeve],
    ["Precio base", configuration.basePrice],
    ["Configuración", configuration.configuredPrice],
  ];

  return <main className="flow-page">
    <FlowHeader current="quote" />
    <FlowSteps active={2} />
    <section className="quote-hero">
      <div>
        <p className="flow-eyebrow">Solicitud de presupuesto</p>
        <h1>Contadnos<br /><em>quiénes sois.</em></h1>
      </div>
      <p>No pagaréis nada ahora. Recibiréis confirmación por correo y una respuesta personal en menos de 24 horas laborables.</p>
    </section>

    <section className="quote-layout">
      <aside className="idea-summary">
        <div className="idea-summary-top"><span>Vuestra idea</span><Link href="/#personalizador">Editar diseño</Link></div>
        <div className="summary-hoodie"><span>TSG</span><strong>{form.groupName || "Nombre del grupo"}</strong><small>{configuration.backDesign}</small></div>
        <div className="idea-details">{summary.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div>
        <div className="summary-note"><b>Después de enviarla</b><p>Un diseñador revisará composición, acabados y viabilidad. La propuesta final se aprueba con vosotros antes de producir.</p></div>
      </aside>

      <form className="quote-form" onSubmit={submit}>
        <div className="form-heading"><span>01</span><div><h2>Datos del organizador</h2><p>Será nuestra persona de contacto durante el proyecto.</p></div></div>
        <div className="form-grid">
          <label className="wide"><span>Nombre y apellidos *</span><input required minLength={2} maxLength={80} autoComplete="name" value={form.organizerName} onChange={event => setField("organizerName", event.target.value)} placeholder="Ej. Lucía Martínez" /></label>
          <label><span>WhatsApp *</span><input required inputMode="tel" autoComplete="tel" value={form.phone} onChange={event => setField("phone", event.target.value)} placeholder="600 000 000" /></label>
          <label><span>Email *</span><input required type="email" autoComplete="email" value={form.email} onChange={event => setField("email", event.target.value)} placeholder="nombre@correo.es" /></label>
          <label className="wide"><span>Nombre del grupo *</span><input required minLength={2} maxLength={90} value={form.groupName} onChange={event => setField("groupName", event.target.value)} placeholder="Ej. Promoción 2026 · IES Las Encinas" /></label>
        </div>

        <div className="form-heading second"><span>02</span><div><h2>Datos del grupo</h2><p>Una aproximación es suficiente para preparar la primera propuesta.</p></div></div>
        <div className="form-grid">
          <label><span>Tipo de grupo</span><select value={form.groupType} onChange={event => setField("groupType", event.target.value)}>{groupTypes.map(type => <option key={type}>{type}</option>)}</select></label>
          <label><span>Localidad</span><input maxLength={90} value={form.location} onChange={event => setField("location", event.target.value)} placeholder="Ej. Sevilla" /></label>
          <label><span>¿Cuántos sois? *</span><input required type="number" min={5} max={500} value={form.quantity} onChange={event => setField("quantity", Number(event.target.value))} /></label>
          <label><span>Fecha deseada</span><input type="date" value={form.desiredDate} onChange={event => setField("desiredDate", event.target.value)} /></label>
          <label className="wide"><span>Enlace a referencias</span><input type="url" maxLength={500} value={form.referenceUrl} onChange={event => setField("referenceUrl", event.target.value)} placeholder="Drive, Instagram, Pinterest… También podréis enviarlas por WhatsApp" /></label>
          <label className="wide quote-file-field"><span>Adjuntar diseño o referencia</span><input type="file" accept=".png,.jpg,.jpeg,.pdf,.ai,image/png,image/jpeg,application/pdf,application/postscript" onChange={event => { const file = event.target.files?.[0] || null; setDesignFile(file); if (file) void trackProductEvent("archivo_uploaded", { product_type: configuration.product.toLowerCase().includes("camiseta") ? "tshirt" : "hoodie" }); }} /><small>{designFile ? `${designFile.name} · ${(designFile.size / 1024 / 1024).toFixed(1).replace(".0", "")} MB` : "PNG, JPG, PDF o AI · máximo 15 MB"}</small></label>
          <label className="wide"><span>Contadnos lo que tenéis en mente</span><textarea maxLength={1200} rows={5} value={form.notes} onChange={event => setField("notes", event.target.value)} placeholder="Nombres individuales, fecha del viaje, dudas, una broma del grupo…" /></label>
          <label className="honeypot" aria-hidden="true"><span>Web</span><input tabIndex={-1} autoComplete="off" value={form.website} onChange={event => setField("website", event.target.value)} /></label>
        </div>

        {turnstileSiteKey && <div className="turnstile-field"><div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-action="quote_request" data-theme="light" /></div>}
        <label className="consent-field"><input required type="checkbox" checked={form.privacyAccepted} onChange={event => setField("privacyAccepted", event.target.checked)} /><span>Acepto que utilicéis estos datos únicamente para preparar el presupuesto y contactarme sobre este pedido. <Link href="/privacidad" target="_blank">Más información sobre privacidad</Link>.</span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="quote-submit" type="submit" disabled={sending}><span><small>{sending ? "Guardando la solicitud" : "Sin compromiso"}</small>{sending ? "Un momento…" : "Enviar mi idea"}</span><b>{sending ? "···" : "↗"}</b></button>
        <p className="form-destination">La solicitud quedará registrada con una referencia. Recibiréis una confirmación automática y continuaremos por WhatsApp.</p>
      </form>
    </section>
    {turnstileSiteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />}
    <FlowFooter />
  </main>;
}

export default function QuotePage() {
  return <Suspense fallback={<main className="flow-page"><FlowHeader current="quote" /><section className="order-loading"><i /><p>Preparando vuestro presupuesto…</p></section><FlowFooter /></main>}><QuotePageContent /></Suspense>;
}
