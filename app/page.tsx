"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, ImageIcon, MapPin, PencilLine, PlayCircle, Shirt, Sparkles, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { CORE_COLORS, DEFAULT_CATALOG, type CatalogColor, type CatalogProduct } from "@/lib/catalog";
import { pricingForSelection } from "@/lib/commercial";
import { trackProductEvent } from "@/lib/analytics";

type Side = "front" | "back";
type DesignPath = "template" | "upload" | "studio";
type ProductType = "hoodie" | "tshirt";

const DesignCarousel = dynamic(() => import("@/app/_components/design-carousel").then((module) => module.DesignCarousel));
const CustomizerDrawer = dynamic(() => import("@/app/_components/customizer-drawer").then((module) => module.CustomizerDrawer), { ssr: false });

const defaultGarmentColors = CORE_COLORS;
const printColors = [
  { name: "Blanco roto", value: "#f7f3e9" }, { name: "Blanco", value: "#ffffff" },
  { name: "Azul cielo", value: "#9ed8f4" }, { name: "Amarillo flúor", value: "#e6ff58" },
  { name: "Rojo", value: "#ff554b" }, { name: "Negro", value: "#17191d" },
];
const styles = [
  { id: "x", label: "X con nombres", tag: "TOP", sample: "X" },
  { id: "number27", label: "Número 27", sample: "27" }, { id: "number26", label: "Número 26", sample: "26" },
  { id: "college", label: "College", sample: "COLLEGE" }, { id: "monument", label: "Nuestro pueblo", sample: "⌂ ♜ ⛪" },
  { id: "group", label: "Ilustración grupo", sample: "● ● ● ●" }, { id: "globe", label: "Sello + frase", sample: "◎" },
  { id: "collage", label: "Collage local", sample: "✦ ♜ ◇" }, { id: "mascot", label: "Mascota", sample: "★" },
];
const designPathOptions = [
  { id: "template", label: "Usar plantilla", Icon: ImageIcon },
  { id: "upload", label: "Subir diseño", Icon: Upload },
  { id: "studio", label: "Diseño a medida", Icon: PencilLine },
] as const;
const frontOptions = [
  { id: "coordinates", label: "Coordenadas", Icon: MapPin },
  { id: "logo", label: "Logo", Icon: BadgeCheck },
  { id: "name", label: "Nombre", Icon: UserRound },
] as const;
const flagOptions = [
  { id: "none", label: "Sin manga", symbol: "" }, { id: "spain", label: "España", symbol: "spain" },
  { id: "community", label: "Comunidad autónoma", symbol: "community" }, { id: "country", label: "Otro país", symbol: "country" },
  { id: "custom", label: "Logo propio", symbol: "custom" },
] as const;
const chapters = ["Prenda", "Diseño", "Extras"];

const faqItems = [
  {
    question: "¿Podemos poner un nombre distinto en cada sudadera?",
    answer:
      "Sí. Cada sudadera puede llevar un nombre distinto en pecho o espalda, y está incluido en el precio base.",
  },
  {
    question: "¿Puedo pagar directamente al pedir presupuesto?",
    answer:
      "No. Primero hablamos con el organizador, cerramos diseño y precio, y después activamos el enlace privado del grupo. Así nadie paga una prenda que todavía no está aprobada.",
  },
  {
    question: "¿Cómo funcionan los pagos individuales?",
    answer:
      "Primero cada persona registra talla, nombre y extras. Nuestro equipo y el organizador cierran la cantidad y el tramo de precio; después se abre el pago. Pueden convivir pagos individuales y un pago final del organizador.",
  },
  {
    question: "¿Qué pasa si alguien no paga a tiempo?",
    answer:
      "No producimos hasta que el pedido esté completamente pagado. Si queda algo pendiente, lo resolvemos directamente con el organizador.",
  },
  {
    question: "¿Qué pasa si no tenemos ningún diseño?",
    answer:
      "Elegid Diseño a medida, mandadnos referencias y nuestro equipo convertirá la idea en una propuesta.",
  },
  {
    question: "¿La bandera puede ir bordada?",
    answer:
      "Sí. Una bandera de país o comunidad autónoma cuesta 1 € en DTF o 2 € bordada por prenda. Un logotipo bordado aportado por el cliente se presupuesta según su complejidad.",
  },
  {
    question: "¿Cuál es el pedido mínimo?",
    answer:
      "La tarifa para grupos empieza en 5 unidades. Para pedidos de 1 a 4 sudaderas, contactad directamente por WhatsApp.",
  },
  {
    question: "¿Podemos mezclar tallas y colores?",
    answer:
      "Podéis mezclar tallas. Para cambios de color dentro del mismo diseño, revisaremos el contraste y la producción.",
  },
  {
    question: "¿Cómo se calcula el envío?",
    answer:
      "El envío conjunto del grupo a Península está incluido. Para Baleares, Canarias, otros países o más de un destino, preparamos una cotización específica.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://tusudaderaengrupo.es/#organization",
      name: "Tu Sudadera en Grupo",
      url: "https://tusudaderaengrupo.es",
      logo: "https://tusudaderaengrupo.es/favicon.svg",
      email: "pedidos@tusudaderaengrupo.es",
      areaServed: { "@type": "Country", name: "España" },
    },
    {
      "@type": "WebSite",
      "@id": "https://tusudaderaengrupo.es/#website",
      url: "https://tusudaderaengrupo.es",
      name: "Tu Sudadera en Grupo",
      inLanguage: "es-ES",
      publisher: { "@id": "https://tusudaderaengrupo.es/#organization" },
    },
    {
      "@type": "Service",
      "@id": "https://tusudaderaengrupo.es/#service",
      name: "Sudaderas personalizadas para grupos",
      serviceType: "Diseño y producción de sudaderas personalizadas",
      provider: { "@id": "https://tusudaderaengrupo.es/#organization" },
      areaServed: { "@type": "Country", name: "España" },
      audience: {
        "@type": "Audience",
        audienceType:
          "Colegios, institutos, promociones, peñas, equipos, clubes y grupos de amigos",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://tusudaderaengrupo.es/#preguntas",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
};

export default function Home() {
  const router = useRouter();
  const [productType, setProductType] = useState<ProductType>("hoodie");
  const [catalog, setCatalog] = useState<CatalogProduct[]>([...DEFAULT_CATALOG]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [garment, setGarment] = useState<CatalogColor>(defaultGarmentColors[0]);
  const [print, setPrint] = useState(printColors[0]);
  const [style, setStyle] = useState(styles[0]);
  const [side, setSide] = useState<Side>("back");
  const [designPath, setDesignPath] = useState<DesignPath>("template");
  const [groupName, setGroupName] = useState("PROMO 26");
  const [frontType, setFrontType] = useState<(typeof frontOptions)[number]["id"]>("coordinates");
  const [frontText, setFrontText] = useState("37°53'N · 4°46'W");
  const [frontLogo, setFrontLogo] = useState("");
  const [frontTechnique, setFrontTechnique] = useState<"print" | "embroidery">("print");
  const [sleeveFlag, setSleeveFlag] = useState<(typeof flagOptions)[number]["id"]>("none");
  const [sleeveTechnique, setSleeveTechnique] = useState<"print" | "embroidery">("print");
  const [sleeveDetail, setSleeveDetail] = useState("");
  const [openStep, setOpenStep] = useState(0);
  const [quantity, setQuantity] = useState(25);
  const [quantityDraft, setQuantityDraft] = useState("25");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadedPreviewKey, setLoadedPreviewKey] = useState("");

  useEffect(() => {
    fetch("/api/catalogo")
      .then(async (response) => {
        if (!response.ok) throw new Error("catalog unavailable");
        const result = await response.json() as { products?: CatalogProduct[] };
        if (result.products?.length) setCatalog(result.products);
      })
      .catch(() => undefined)
      .finally(() => setCatalogLoaded(true));
  }, []);

  const categoryAvailable = (category: ProductType) => !catalogLoaded || catalog.some((product) => product.category === category && product.active);
  const activeProduct = catalog.find((product) => product.category === productType && product.active)
    || (!catalogLoaded ? DEFAULT_CATALOG.find((product) => product.category === productType) : undefined)
    || catalog.find((product) => product.active)
    || DEFAULT_CATALOG[0];
  const garmentColors = productType === "hoodie" ? defaultGarmentColors : (activeProduct.colors.length ? activeProduct.colors : defaultGarmentColors);

  useEffect(() => {
    return () => {
      if (frontLogo.startsWith("blob:")) URL.revokeObjectURL(frontLogo);
    };
  }, [frontLogo]);

  const designText = useMemo(() => {
    const name = groupName || "VUESTRO GRUPO";
    if (designPath === "upload") return "TU DISEÑO\nSUBIDO";
    if (designPath === "studio") return "IDEA 100%\nA MEDIDA";
    if (style.id === "x") return `${name}\nX`;
    if (style.id === "number27") return `27\n${name}`;
    if (style.id === "number26") return `26\n${name}`;
    if (style.id === "college") return `${name}\nCOLLEGE`;
    if (style.id === "monument") return `${name}\nPUEBLO & FIESTA`;
    if (style.id === "group") return `${name}\nLA PEÑA`;
    if (style.id === "globe") return `${name}\nNUESTRA FRASE`;
    if (style.id === "collage") return `${name}\nRECUERDOS`;
    return `${name}\nX ANIVERSARIO`;
  }, [designPath, groupName, style]);
  const previewKey = `${productType}-${garment.name}-${side}`;
  const previewLoaded = productType !== "hoodie" || loadedPreviewKey === previewKey;

  const selectionPricing = pricingForSelection(activeProduct, quantity, {
    frontType,
    frontTechnique,
    sleeveFlag,
    sleeveTechnique,
  });
  const basePriceCents = selectionPricing.baseUnitPriceCents;
  const baseUnitPrice = basePriceCents === null ? null : basePriceCents / 100;
  const productName = productType === "hoodie" ? "Sudadera" : "Camiseta";
  const productModel = activeProduct.model;
  const backDesignLabel = designPath === "template" ? style.label : designPath === "upload" ? "Diseño aportado" : "Diseño a medida";
  const frontDesignLabel = frontOptions.find((item) => item.id === frontType)?.label || "Detalle delantero";
  const selectedFlag = flagOptions.find((item) => item.id === sleeveFlag)?.label || "Sin bandera";
  const customEmbroidery = selectionPricing.customPricingRequired;
  const knownExtras = selectionPricing.commonExtrasCents / 100;
  const configuredUnitPrice = selectionPricing.quotedUnitPriceCents === null
    ? null
    : selectionPricing.quotedUnitPriceCents / 100;
  const hasPriceExtra = knownExtras > 0 || customEmbroidery;
  const progress = ((openStep + 1) / chapters.length) * 100;
  const updateQuantity = (value: number) => {
    const next = Number.isFinite(value) ? Math.min(500, Math.max(5, Math.round(value))) : 5;
    setQuantity(next);
    setQuantityDraft(String(next));
  };
  const commitQuantityDraft = () => updateQuantity(Number(quantityDraft));
  const scrollToCustomizer = () => {
    void trackProductEvent("personalizador_started", { source: "homepage" });
    document.getElementById("personalizador")?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToCalculator = () => {
    document.getElementById("presupuesto")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const selectProduct = (nextProduct: ProductType) => {
    if (!categoryAvailable(nextProduct)) return;
    setProductType(nextProduct);
    const nextCatalogProduct = catalog.find((product) => product.category === nextProduct && product.active);
    if (nextCatalogProduct?.colors.length && !nextCatalogProduct.colors.some((color) => color.name === garment.name)) setGarment(nextCatalogProduct.colors[0]);
    void trackProductEvent("producto_selected", { product_type: nextProduct });
  };
  const selectColor = (nextColor: CatalogColor) => {
    setGarment(nextColor);
    void trackProductEvent("color_selected", { product_type: productType, color: nextColor.name });
  };
  const selectFrontLogo = (file?: File) => {
    if (!file) return;
    setFrontLogo(URL.createObjectURL(file));
    setSide("front");
    toast.success("Logo añadido", { description: "Ya aparece en la vista frontal orientativa." });
  };
  const chooseShowcaseDesign = (designId: string, title: string) => {
    const selectedStyle = styles.find((item) => item.id === designId);
    if (selectedStyle) setStyle(selectedStyle);
    setDesignPath("template");
    setOpenStep(1);
    setSide("back");
    document.getElementById("personalizador")?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast.success("Plantilla aplicada", { description: `${title} ya es vuestro punto de partida.` });
  };
  const selectSleeveFlag = (nextFlag: (typeof flagOptions)[number]["id"]) => {
    setSleeveFlag(nextFlag);
    setSleeveDetail(nextFlag === "spain" ? "España" : nextFlag === "community" ? "Comunidad Valenciana" : nextFlag === "country" ? "Francia" : "");
  };
  const goToQuote = () => {
    void trackProductEvent("personalizador_completed", {
      product_type: productType,
      model: productModel,
      color: garment.name,
      quantity,
      design_path: designPath,
    });
    const params = new URLSearchParams({
      productSlug: activeProduct.slug,
      productCategory: productType,
      product: productName,
      model: productModel,
      color: garment.name,
      printColor: print.name,
      designPath,
      designStyle: style.id,
      backDesign: designPath === "template" ? style.label : designPath === "upload" ? "Diseño subido" : "Diseño a medida",
      groupName: groupName || "Sin nombre todavía",
      frontType,
      frontText,
      frontTechnique,
      frontDesign: `${frontOptions.find((item) => item.id === frontType)?.label || "Sin definir"}${frontText ? ` · ${frontText}` : ""} · ${frontTechnique === "embroidery" ? "Bordado" : "DTF"}`,
      sleeveFlag,
      sleeveDetail,
      sleeveTechnique,
      sleeve: `${flagOptions.find((item) => item.id === sleeveFlag)?.label || "Sin manga"}${sleeveDetail ? ` · ${sleeveDetail}` : ""} · ${sleeveTechnique === "embroidery" ? "Bordado" : "DTF"}`,
      quantity: String(quantity),
      basePrice: baseUnitPrice === null ? "Consultar" : `${baseUnitPrice} € por unidad`,
      configuredPrice: configuredUnitPrice === null ? "Consultar" : `${configuredUnitPrice} € por unidad`,
    });
    router.push(`/presupuesto?${params.toString()}`);
  };

  return <main className="homepage-flow">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
    <div className="announcement"><span>Precios claros · IVA incluido</span><i aria-hidden="true" /><span>Nombre individual incluido</span><i aria-hidden="true" /><span>Envío gratis a Península</span></div>
    <header className="site-header">
      <a className="brand" href="#inicio" aria-label="Tu sudadera en grupo, inicio"><BrandMark /><span className="brand-copy"><strong>Tu sudadera</strong><small>en grupo</small></span></a>
      <nav id="site-navigation" className={menuOpen ? "open" : ""} aria-label="Navegación principal"><a onClick={() => setMenuOpen(false)} href="#personalizador">Diseñadla</a><a onClick={() => setMenuOpen(false)} href="#para-grupos">Para grupos</a><a onClick={() => setMenuOpen(false)} href="#inspiracion">Diseños</a><a onClick={() => setMenuOpen(false)} href="#pagos">Pagos</a><a onClick={() => setMenuOpen(false)} href="#como-funciona">Cómo funciona</a><a onClick={() => setMenuOpen(false)} href="#preguntas">Dudas</a></nav>
      <div className="header-actions"><Link className="ghost-button" href="/pedido">Ya tengo un pedido</Link><button className="header-cta" onClick={goToQuote}>Pedir presupuesto <span>↗</span></button><button className="menu-button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-controls="site-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button></div>
    </header>

    <section className="hero" id="inicio">
      <div className="hero-copy">
        <div className="hero-kicker"><span className="avatar-stack"><i>J</i><i>M</i><i>L</i></span><span>Creada para grupos que<br />no quieren vestir como todos</span></div>
        <h1>Sudaderas personalizadas<br /><em>para grupos.</em></h1>
        <p className="hero-lead"><strong>No es una sudadera. Es vuestro uniforme.</strong> Diseñad una prenda que cuente vuestra historia, con precios reales desde el principio y sin esperar una respuesta para saber cuánto cuesta.</p>
        <div className="hero-actions"><button className="primary-button" onClick={scrollToCustomizer}>Empezar a diseñar <span>↗</span></button><a className="play-link" href="#como-funciona"><b><PlayCircle aria-hidden="true" /></b><span>Ver cómo funciona<br /><small>4 pasos claros</small></span></a></div>
        <div className="hero-proof"><div><strong>Desde 22 € · IVA incluido</strong><span>Sudadera, DTF delante y detrás y nombre</span></div><div><strong>Envío gratis a Península</strong><span>Un único envío para todo el grupo</span></div></div>
      </div>
      <div className="hero-stage"><div className="stage-grid" /><span className="sticker sticker-one">VUESTRO<br />DISEÑO</span><span className="sticker sticker-two">HECHO<br />JUNTOS</span><div className="hero-hoodie hero-hoodie-back"><Hoodie color={CORE_COLORS[4].value} printColor="#9ed8f4" text={"PROMO 26\nX"} side="back" designStyle="x" /></div><div className="hero-hoodie hero-hoodie-front"><Hoodie color={CORE_COLORS[0].value} printColor="#f7f3e9" text={"PROMO\n26"} side="front" frontType="name" frontText="PROMO 26" sleeveFlag="spain" /></div><div className="stage-note"><span>01</span><p>Dos vistas.<br /><strong>Mil posibilidades.</strong></p></div></div>
    </section>

    <div className="ticker" aria-hidden="true"><div><span>COLEGIOS ✦ PEÑAS ✦ UNIVERSIDAD ✦ VIAJES ✦ EQUIPOS ✦ AMIGOS ✦ </span><span>COLEGIOS ✦ PEÑAS ✦ UNIVERSIDAD ✦ VIAJES ✦ EQUIPOS ✦ AMIGOS ✦ </span></div></div>
    <section className="quick-benefits" aria-label="Ventajas"><article><span>01</span><div><h3>Vosotros imagináis</h3><p>Elegid una plantilla, subid vuestro diseño o contadnos una idea.</p></div></article><article><span>02</span><div><h3>Nosotros lo hacemos pro</h3><p>Un diseñador revisa composición, tamaños y acabados.</p></div></article><article><span>03</span><div><h3>El grupo decide</h3><p>Recibís una maqueta final antes de producir una sola prenda.</p></div></article></section>

    <section className="audience-directory" id="para-grupos">
      <div className="audience-directory-heading"><p className="eyebrow"><span /> Sudaderas para vuestro grupo</p><h2>La misma idea de pertenecer.<br /><em>Una historia diferente.</em></h2><p>Cada tipo de grupo necesita organizarse y expresarse de una manera. Descubrid ideas, opciones y respuestas pensadas para vosotros.</p></div>
      <div className="audience-directory-grid">
        <Link href="/sudaderas-colegios-institutos"><span>01</span><div><small>Clases y viajes</small><h3>Colegios e institutos</h3><p>Nombres, promociones, tallas y pagos individuales.</p></div><b>↗</b></Link>
        <Link href="/sudaderas-penas"><span>02</span><div><small>Fiestas y amigos</small><h3>Peñas</h3><p>Mascotas, aniversarios y orgullo de pueblo.</p></div><b>↗</b></Link>
        <Link href="/sudaderas-fin-de-curso"><span>03</span><div><small>El recuerdo del curso</small><h3>Fin de curso</h3><p>Promoción, año y todos los nombres del grupo.</p></div><b>↗</b></Link>
        <Link href="/sudaderas-equipos-clubes"><span>04</span><div><small>Una identidad común</small><h3>Equipos y clubes</h3><p>Escudos, dorsales, cuerpo técnico y afición.</p></div><b>↗</b></Link>
      </div>
    </section>

    <section className="customizer-section" id="personalizador">
      <div className="section-heading dark-heading"><div><p className="eyebrow"><span /> Personalizador</p><h2>De cero a<br /><em>“la necesitamos”.</em></h2></div><p>Jugad con las opciones. No hace falta tenerlo claro: guardaremos vuestra idea y la terminaremos juntos.</p></div>
      <div className="customizer-shell">
        <div className="customizer-progress"><span style={{width:`${progress}%`}} /><div>{chapters.map((item,index)=><button type="button" key={item} className={openStep===index?"active":openStep>index?"done":""} aria-current={openStep===index ? "step" : undefined} onClick={()=>setOpenStep(index)}><i>{openStep>index?"✓":String(index+1).padStart(2,"0")}</i>{item}</button>)}</div></div>
        <div className="customizer-layout">
          <div className="preview-panel">
            <div className="preview-toolbar"><span>Vista previa en directo <i>Live</i></span><div className="side-toggle" role="group" aria-label={`Vista de la ${productName.toLowerCase()}`}><button type="button" aria-pressed={side==="front"} className={side==="front"?"active":""} onClick={()=>setSide("front")}>Delante</button><button type="button" aria-pressed={side==="back"} className={side==="back"?"active":""} onClick={()=>setSide("back")}>Espalda</button></div></div>
            <div className="preview-stage" aria-busy={!previewLoaded}>
              <span className="preview-model">{productType === "hoodie" ? <>{activeProduct.model.toUpperCase()}<br /><small>Heavy Blend</small></> : <>CAMISETA<br /><small>{activeProduct.model}</small></>}</span>
              {!previewLoaded && <div className="preview-skeleton" role="status"><span className="sr-only">Cargando vista previa del producto</span><i /><b /><em /></div>}
              <div className="preview-media" key={previewKey}>
                {productType === "hoodie" ? <Hoodie color={garment.value} printColor={print.value} text={designText} side={side} designStyle={style.id} frontType={frontType} frontText={frontText} frontLogo={frontLogo} sleeveFlag={flagOptions.find(item=>item.id===sleeveFlag)?.symbol||""} sleeveTechnique={sleeveTechnique} onImageLoad={()=>setLoadedPreviewKey(previewKey)} /> : <TShirt color={garment.value} printColor={print.value} text={designText} side={side} frontType={frontType} frontText={frontText} />}
              </div>
              <div className="zoom-hint">Vista orientativa</div>
            </div>
            <div className="mobile-preview-controls" aria-label="Color de la prenda">
              <div className="mobile-preview-controls-heading">
                <span>Color de la prenda</span>
                <strong aria-live="polite">{garment.name}</strong>
              </div>
              <div className="mobile-color-rail">
                {garmentColors.map(item=><button type="button" key={item.name} className={garment.name===item.name?"mobile-color-choice active":"mobile-color-choice"} style={{"--swatch":item.value} as React.CSSProperties} onClick={()=>selectColor(item)} aria-label={`Color ${item.name}`} aria-pressed={garment.name===item.name}><i /><small>{item.name}</small></button>)}
              </div>
            </div>
            <div className="preview-summary"><div><span>Prenda</span><b>{productName}</b></div><div><span>Color</span><b>{garment.name}</b></div><div><span>Diseño</span><b>{designPath==="template"?style.label:designPath==="upload"?"Subido":"A medida"}</b></div></div>
          </div>
          <div className="controls-panel">
            {openStep===0&&<div className="step-view"><StepHeader number="01" title="Elegid vuestra prenda" text="El color se cambia junto a la sudadera. Aquí solo tenéis que confirmar el modelo." /><div className="product-type-options" role="group" aria-label="Tipo de prenda"><button type="button" disabled={!categoryAvailable("hoodie")} className={productType === "hoodie" ? "active" : ""} aria-pressed={productType === "hoodie"} onClick={() => selectProduct("hoodie")}><b><Shirt aria-hidden="true" />Sudadera</b><span>{catalog.find(product => product.category === "hoodie")?.model || "Gildan 18500"} · {categoryAvailable("hoodie") ? "precios publicados" : "no disponible"}</span><em>Recomendada</em></button><button type="button" disabled={!categoryAvailable("tshirt")} className={productType === "tshirt" ? "active" : ""} aria-pressed={productType === "tshirt"} onClick={() => selectProduct("tshirt")}><b><Shirt aria-hidden="true" />Camiseta</b><span>{catalog.find(product => product.category === "tshirt")?.model || "Modelo por confirmar"} · {!categoryAvailable("tshirt") ? "no disponible" : catalog.find(product => product.category === "tshirt")?.quoteOnly !== false ? "tarifa por confirmar" : "precios publicados"}</span><em>Secundaria</em></button></div><div className="desktop-product-color"><h3 className="field-title">Color <span>{garment.name}</span></h3><div className="swatches labeled">{garmentColors.map(item=><button type="button" key={item.name} className={garment.name===item.name?"swatch active":"swatch"} style={{"--swatch":item.value} as React.CSSProperties} onClick={()=>selectColor(item)} aria-label={item.name} aria-pressed={garment.name===item.name}><i /><small>{item.name}</small></button>)}</div></div><p className="config-hint"><b>{activeProduct.model}</b><span>{productType === "hoodie" ? "Incluye impresión en pecho, espalda y nombre." : "Podéis definir el diseño mientras publicamos su tarifa."}</span></p><NextButton onClick={()=>setOpenStep(1)} label="Continuar con el diseño" /></div>}
            {openStep===1&&<div className="step-view"><StepHeader number="02" title="Diseñadla a vuestro estilo" text="La espalda y el detalle delantero viven ahora en una misma pantalla." /><div className="path-tabs">{designPathOptions.map(item=><button type="button" key={item.id} className={designPath===item.id?"active":""} aria-pressed={designPath===item.id} onClick={()=>setDesignPath(item.id)}><b><item.Icon aria-hidden="true" /></b><span>{item.label}</span></button>)}</div>{designPath==="template"&&<><h3 className="field-title">Plantilla de espalda <span>{style.label}</span></h3><div className="style-options">{styles.map(item=><button type="button" key={item.id} className={style.id===item.id?`style-option active ${item.id}`:`style-option ${item.id}`} aria-pressed={style.id===item.id} onClick={()=>{setStyle(item);setSide("back")}}>{item.tag&&<em>{item.tag}</em>}<b>{item.sample}</b><small>{item.label}</small></button>)}</div><label className="text-field"><span>Nombre, año o frase principal</span><input value={groupName} onChange={e=>setGroupName(e.target.value.toUpperCase().slice(0,18))} placeholder="EJ. PROMO 26" /></label><h3 className="field-title compact-title">Color del diseño <span>{print.name}</span></h3><div className="swatches print-swatches">{printColors.map(item=><button type="button" key={item.name} className={print.name===item.name?"swatch active":"swatch"} style={{"--swatch":item.value} as React.CSSProperties} onClick={()=>setPrint(item)} aria-label={item.name} aria-pressed={print.name===item.name}><i /></button>)}</div></>}{designPath==="upload"&&<UploadDrop title="Adjuntad vuestro diseño al pedir presupuesto" text="Aceptamos PNG, JPG, PDF o AI hasta 15 MB. Verificamos el formato y lo guardamos de forma privada." />}{designPath==="studio"&&<div className="studio-card"><span>Diseñado desde cero</span><h3>Mandad una foto, un dibujo o incluso una nota de voz.</h3><p>Podemos ilustrar vuestro pueblo, el grupo, una mascota o cualquier idea que os represente.</p><ul><li>Propuesta visual sin compromiso</li><li>Ajustes con vuestro diseñador</li><li>Preparado para producir</li></ul></div>}<details className="front-details"><summary><span><small>Opcional · incluido</small>Detalle delantero</span><b>{frontDesignLabel}<i>+</i></b></summary><div className="front-details-body"><div className="front-options">{frontOptions.map(item=><button type="button" key={item.id} className={frontType===item.id?"active":""} aria-pressed={frontType===item.id} onClick={()=>{setFrontType(item.id);setSide("front")}}><b><item.Icon aria-hidden="true" /></b><span>{item.label}</span></button>)}</div>{frontType==="coordinates"&&<label className="text-field"><span>Coordenadas</span><input value={frontText} onChange={e=>setFrontText(e.target.value.slice(0,28))} placeholder="37°53'N · 4°46'W" /></label>}{frontType==="name"&&<label className="text-field"><span>Nombre o mote</span><input value={frontText} onChange={e=>setFrontText(e.target.value.toUpperCase().slice(0,18))} placeholder="NOMBRE" /></label>}{frontType==="logo"&&<label className="upload-control"><input type="file" accept="image/png,image/jpeg" onChange={e=>selectFrontLogo(e.target.files?.[0])} /><b>{frontLogo?<BadgeCheck aria-hidden="true" />:<Upload aria-hidden="true" />}</b><span>{frontLogo?"Logo cargado · cambiar":"Subir logo delantero"}</span><small>PNG o JPG</small></label>}<h3 className="field-title compact-title">Acabado delantero <span>{frontTechnique === "print" ? "DTF incluido" : frontType === "coordinates" ? "+1 €" : "A consultar"}</span></h3><div className="technique-cards"><button type="button" aria-pressed={frontTechnique==="print"} className={frontTechnique==="print"?"active":""} onClick={()=>setFrontTechnique("print")}><b>DTF</b><span>Incluido</span><small>A todo color y hasta A5</small></button><button type="button" aria-pressed={frontTechnique==="embroidery"} className={frontTechnique==="embroidery"?"active":""} onClick={()=>setFrontTechnique("embroidery")}><b><Sparkles aria-hidden="true" /></b><span>Bordado</span><small>{frontType === "coordinates" ? "Coordenadas · +1 €" : "Logo o texto · a consultar"}</small></button></div></div></details><NextButton onClick={()=>{setOpenStep(2);setSide("front")}} label="Ver extras y precio" /></div>}
            {openStep===2&&<div className="step-view"><StepHeader number="03" title="Extras y precio" text="La manga es opcional. Cuando acabéis, la calculadora ya tendrá vuestra configuración." /><h3 className="field-title">Personalización de manga <span>{sleeveFlag === "none" ? "Sin extra" : selectedFlag}</span></h3><div className="flag-options">{flagOptions.map(item=><button type="button" key={item.id} className={sleeveFlag===item.id?"active":""} aria-pressed={sleeveFlag===item.id} onClick={()=>selectSleeveFlag(item.id)}><b>{item.symbol ? <FlagMark type={item.symbol} /> : "—"}</b><span>{item.label}</span></button>)}</div>{sleeveFlag!=="none"&&<>{sleeveFlag!=="spain"&&<label className="text-field"><span>{sleeveFlag === "custom" ? "Nombre o referencia del logo" : "¿Cuál?"}</span><input value={sleeveDetail} onChange={e=>setSleeveDetail(e.target.value.slice(0,50))} placeholder={sleeveFlag === "community" ? "Ej. Madrid" : sleeveFlag === "country" ? "Ej. Portugal" : "Ej. escudo del club"} /></label>}<h3 className="field-title compact-title">Acabado <span>{sleeveTechnique === "print" ? "+1 €" : sleeveFlag === "custom" ? "A consultar" : "+2 €"}</span></h3><div className="technique-cards"><button type="button" aria-pressed={sleeveTechnique==="print"} className={sleeveTechnique==="print"?"active":""} onClick={()=>setSleeveTechnique("print")}><b>DTF</b><span>Estampada</span><small>+1 € por prenda</small></button><button type="button" aria-pressed={sleeveTechnique==="embroidery"} className={sleeveTechnique==="embroidery"?"active":""} onClick={()=>setSleeveTechnique("embroidery")}><b><Sparkles aria-hidden="true" /></b><span>Bordada</span><small>{sleeveFlag === "custom" ? "Precio según el logotipo" : "+2 € por prenda"}</small></button></div></>}<button type="button" className="finish-button" onClick={scrollToCalculator}><span><small>{configuredUnitPrice === null ? "Revisión necesaria" : `Desde ${configuredUnitPrice} € / unidad`}</small>Ver mi precio y presupuesto</span><b>↓</b></button><p className="save-note">No pagaréis nada ahora. Primero revisamos el diseño y cerramos la cantidad real.</p></div>}
          </div>
        </div>
      </div>
    </section>

    <section className="price-section price-section-linked" id="presupuesto">
      <div className="price-copy">
        <p className="eyebrow light"><span /> Calculadora del diseño</p>
        <h2>Diseño listo.<br /><em>Precio al momento.</em></h2>
        <p>La cantidad y los extras se actualizan con vuestra prenda, para que podáis decidirlo todo en el mismo recorrido.</p>
        <div className="included-list"><span>✓ {productType === "hoodie" ? "Gildan 18500 incluida" : "Diseño y revisión incluidos"}</span><span>✓ Impresión en pecho y espalda</span><span>✓ Nombre individual incluido</span><span>✓ IVA y envío a Península</span></div>
        <div className="single-order-note"><b>¿Necesitáis de 1 a 4 unidades?</b><span>También las hacemos. Escribidnos por WhatsApp para recibir un precio individual.</span></div>
      </div>
      <div className="price-card"><p className="preview-disclaimer">Previsualización orientativa. Recibirás la propuesta final para aprobación antes de producir.</p>
        <div className="price-reference-heading"><span>Calculadora transparente</span><strong>Precio por {productName.toLowerCase()} · IVA incluido</strong></div>
        <div className="price-reference-product">
          <div className="price-mini-hoodies" aria-label={`Vista de la ${productName.toLowerCase()} de referencia`}>
            <div className="price-mini-item"><span>Espalda</span>{productType === "hoodie" ? <Hoodie color={garment.value} printColor={print.value} text={designText} side="back" designStyle={style.id} /> : <TShirt color={garment.value} printColor={print.value} text={designText} side="back" />}</div>
            <div className="price-mini-item"><span>Delante</span>{productType === "hoodie" ? <Hoodie color={garment.value} printColor={print.value} text={designText} side="front" frontType={frontType} frontText={frontText} frontLogo={frontLogo} /> : <TShirt color={garment.value} printColor={print.value} text={designText} side="front" frontType={frontType} frontText={frontText} />}</div>
          </div>
          <div className="price-product-copy"><small>{productName} base</small><h3>{productType === "hoodie" ? "Gildan® 18500 Heavy Blend" : "Camiseta personalizada"}</h3><p>{productType === "hoodie" ? `Con capucha · Unisex · 50% algodón / 50% poliéster · Color ${garment.name}` : `El modelo y la tarifa se publicarán cuando estén cerrados. Color orientativo: ${garment.name}.`}</p></div>
        </div>
        <div className="price-top"><label htmlFor="quantity-input">Número de {productName.toLowerCase()}s</label><div className="quantity-input-wrap"><input id="quantity-input" aria-label={`Número de ${productName.toLowerCase()}s`} type="number" inputMode="numeric" min="5" max="500" step="1" value={quantityDraft} onChange={event => setQuantityDraft(event.target.value)} onBlur={commitQuantityDraft} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); commitQuantityDraft(); event.currentTarget.blur(); } }} /><span>unidades</span></div></div>
        <input aria-label={`Ajustar número de ${productName.toLowerCase()}s`} aria-valuetext={quantity >= 101 ? "Consultar para 101 o más unidades" : `${quantity} unidades`} type="range" min="5" max="101" value={Math.min(quantity, 101)} onChange={e=>updateQuantity(Number(e.target.value))} />
        <div className="range-labels"><span>5</span><span>30</span><span>50</span><span>75</span><span>101+ · consultar</span></div>
        <div className="price-live-result" aria-live="polite"><div><span>Precio base</span><strong key={`base-${productType}-${baseUnitPrice}`}>{baseUnitPrice === null ? "Consultar" : <>{baseUnitPrice}<sup>€</sup></>}</strong><small>{productType === "hoodie" ? "Sudadera + impresión en pecho + espalda + nombre" : "Modelo y precio de camiseta pendientes de publicación"}</small></div><div className={configuredUnitPrice === null ? "consult" : ""}><span>Vuestra configuración</span><strong key={`configured-${configuredUnitPrice}-${knownExtras}-${customEmbroidery}`}>{configuredUnitPrice === null ? "Consultar" : <>{configuredUnitPrice}<sup>€</sup></>}</strong><small>{customEmbroidery ? "Incluye un logo bordado pendiente de valorar" : knownExtras ? `Incluye ${knownExtras} € en extras por prenda` : "Sin extras seleccionados"}</small></div></div>
        {productType !== "hoodie" && <div className="shirt-price-pending"><b>Tarifa de camisetas pendiente</b><p>Podéis incluir camisetas en la solicitud. Antes de activar pagos publicaremos el modelo, la impresión incluida y todos sus tramos de precio.</p></div>}
        <div className="price-customization-summary"><div><span>Diseño incluido</span><strong>{backDesignLabel} + {frontDesignLabel}</strong><small>DTF a todo color · {print.name} como color principal</small></div><div><span>Manga seleccionada</span><strong>{sleeveFlag === "none" ? "Sin personalización" : `${selectedFlag}${sleeveDetail ? ` · ${sleeveDetail}` : ""}`}</strong><small>{sleeveFlag === "none" ? "Podéis añadirla arriba" : sleeveTechnique === "embroidery" ? "Acabado bordado" : "Acabado DTF"}</small></div></div>
        {hasPriceExtra && <div className={customEmbroidery ? "price-extra-notice consult" : "price-extra-notice"}><b>{customEmbroidery ? "Revisión necesaria" : "Extras calculados"}</b><span>{customEmbroidery ? "Un logo bordado se valora según tamaño, puntadas y complejidad. No inventamos un precio automático." : `La configuración añade ${knownExtras} € por cada prenda que lleve esos extras.`}</span></div>}
        <button className="price-quote-button" onClick={goToQuote}>Pedir mi presupuesto <b>↗</b></button>
        <small className="price-disclaimer">El precio definitivo se fija al cerrar la cantidad real con el organizador. Para 101 o más unidades y bordados personalizados, preparamos una valoración específica.</small>
      </div>
    </section>

    <section className="inspiration-section" id="inspiracion"><div className="section-heading"><div><p className="eyebrow"><span /> Diseños con historia</p><h2>Cinco formas de decir<br /><em>“somos nosotros”.</em></h2></div><p>No vendemos dibujos genéricos. Estas rutas son el punto de partida para convertir personas, lugares y bromas internas en una prenda.</p></div><DesignCarousel><ShowcaseCard className="sky" number="01" eyebrow="La más pedida" title="La X de nombres" text="Todos dentro del mismo diseño." design="x" color="#14223e" print="#9ed8f4" onSelect={chooseShowcaseDesign} /><ShowcaseCard number="02" eyebrow="Orgullo local" title="Vuestro pueblo" text="Calles, monumentos y coordenadas." design="monument" color="#ece8dd" print="#14223e" onSelect={chooseShowcaseDesign} /><ShowcaseCard number="03" eyebrow="100% vuestro" title="El grupo ilustrado" text="De una foto a un recuerdo." design="group" color="#753247" print="#f7f3e9" onSelect={chooseShowcaseDesign} /><ShowcaseCard number="04" eyebrow="Muchos recuerdos" title="Collage local" text="Símbolos que solo vosotros entendéis." design="collage" color="#174f42" print="#e6ff58" onSelect={chooseShowcaseDesign} /><ShowcaseCard className="dark" number="05" eyebrow="Peñas y equipos" title="Mascota + aniversario" text="Una identidad que vuelve cada año." design="mascot" color="#14223e" print="#f7f3e9" onSelect={chooseShowcaseDesign} /></DesignCarousel></section>

    <section className="why-section"><div className="why-copy"><p className="eyebrow light"><span /> Cero dramas de grupo</p><h2>Una persona organiza.<br /><em>Los datos siguen privados.</em></h2><p>El organizador controla cuántas personas se han registrado, cuántas han pagado, el importe pendiente y el reparto de tallas. No necesita ver nombres ni datos personales.</p><a href="#pagos">Ver el recorrido del grupo <span>↗</span></a></div><div className="phone-mockup"><div className="phone-top"><i /><span>Pedido · Promo 26</span><b>•••</b></div><div className="phone-card"><span>Resumen del grupo</span><strong>18 de 25 pagadas</strong><div><i style={{width:"72%"}} /></div></div><div className="member-list aggregate-list">{[["25","Registradas","Lista cerrada"],["18","Pagadas","72% completado"],["7","Pendientes","Importe restante"],["S–3XL","Tallas","Reparto disponible"]].map((item)=><article key={item[1]}><b>{item[0]}</b><span><strong>{item[1]}</strong><small>{item[2]}</small></span><i>→</i></article>)}</div></div></section>

    <section className="payment-section" id="pagos">
      <div className="payment-copy">
        <p className="eyebrow"><span /> Pagos sin perseguir a nadie</p>
        <h2>Primero hablamos.<br /><em>Después paga el grupo.</em></h2>
        <p>El pago nunca aparece antes de tiempo. Primero el grupo registra tallas, nombres y extras; después cerramos la cantidad real, fijamos el tramo y abrimos el pago.</p>
        <div className="payment-options-public">
          <article><i>01</i><div><strong>Primero, registro sin pago</strong><small>Cada persona configura sus prendas y puede editarlas desde el enlace enviado por correo.</small></div></article>
          <article><i>02</i><div><strong>Después, precio cerrado</strong><small>El grupo paga individualmente y el organizador puede completar cualquier saldo restante.</small></div></article>
        </div>
        <div className="payment-rule"><b>Tarjeta, Bizum o transferencia</b><p>La pasarela se activará cuando estén aprobados diseño, cantidad y precio. Las transferencias se validan manualmente.</p></div>
      </div>

      <div className="payment-gate">
        <span className="payment-gate-lock">⌁</span>
        <small>ACCESO PRIVADO</small>
        <h3>¿Ya tenéis un pedido aprobado?</h3>
        <p>El organizador recibe un enlace único. Desde ahí el grupo registra sus prendas y, cuando la lista queda cerrada, accede al pago.</p>
        <Link className="payment-gate-primary" href="/pedido">Entrar a mi pedido <b>→</b></Link>
        <span className="payment-gate-note">El cobro real se activará al conectar el TPV definitivo.</span>
      </div>
    </section>

    <section className="process-section" id="como-funciona"><div className="process-heading"><p className="eyebrow"><span /> Así de fácil</p><h2>De la idea<br /><em>al unboxing.</em></h2><p>Un recorrido pensado para que el precio no cambie después de cobrar y para que el organizador no tenga que perseguir a nadie.</p></div><div className="process-timeline"><article><span>01</span><div><small>Idea y presupuesto</small><h3>Veis el precio desde el principio</h3><p>Elegís diseño, color, cantidad y extras. El formulario guarda la configuración y os respondemos en menos de 24 horas laborables.</p></div><b>Sin compromiso</b></article><article><span>02</span><div><small>Maqueta</small><h3>Aprobamos juntos el diseño</h3><p>Nuestro equipo y el organizador revisan la maqueta, la disponibilidad y todos los detalles antes de abrir el grupo.</p></div><b>Todo claro</b></article><article><span>03</span><div><small>Registro y pago</small><h3>Primero se registra; después se paga</h3><p>Cada persona añade sus prendas. Cuando cerramos la cantidad real, fijamos el precio y se activan tarjeta, Bizum o transferencia.</p></div><b>Precio cerrado</b></article><article><span>04</span><div><small>Producción y envío</small><h3>10–15 días laborables</h3><p>Con el pedido completamente pagado, producimos y enviamos todo junto gratis a una dirección en Península.</p></div><b>Seguimiento</b></article></div></section>

    <section className="reviews-section" aria-labelledby="process-proof-title"><div className="reviews-heading"><p className="eyebrow"><span /> Confianza sin letra pequeña</p><h2 id="process-proof-title">Antes de producir,<br /><em>todo está claro.</em></h2><p className="proof-intro">Las opiniones reales llegarán cuando podamos publicarlas y verificarlas. Mientras tanto, estas son las garantías concretas del proceso.</p></div><div className="review-grid proof-grid"><article className="review-card proof-card"><span>01</span><h3>Veis la maqueta</h3><p>Revisáis diseño, colores, nombres y colocaciones antes de aprobar la producción.</p><strong>Sin producir a ciegas</strong></article><article className="review-card proof-card"><span>02</span><h3>Confirmáis el precio</h3><p>El pago solo se abre después de cerrar cantidades, acabados y precio definitivo.</p><strong>Sin sorpresas</strong></article><article className="review-card proof-card"><span>03</span><h3>Controláis el grupo</h3><p>El pedido privado reúne tallas, personalizaciones y pagos individuales o conjuntos.</p><strong>Todo en un solo sitio</strong></article></div></section>
    <section className="faq-section" id="preguntas"><div className="faq-heading"><p className="eyebrow"><span /> Todo claro</p><h2>Las dudas<br /><em>antes del sí.</em></h2><p>Si vuestra pregunta no está aquí, nos escribís y os respondemos sin bots ni respuestas copiadas.</p></div><div className="faq-list">{faqItems.map((item, index) => <details key={item.question} open={index === 0}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}</div></section>
    <section className="final-cta"><div className="cta-orbit"><span>✦</span></div><p>No hace falta tener el diseño perfecto.</p><h2>Solo una idea que<br /><em>merezca llevarse puesta.</em></h2><button onClick={goToQuote}>Pedir presupuesto <span>↗</span></button></section>
    <footer><div className="footer-top"><a className="brand footer-brand" href="#inicio"><BrandMark /><span className="brand-copy"><strong>Tu sudadera</strong><small>en grupo</small></span></a><p>Sudaderas para grupos con precios claros, diseño incluido y entrega conjunta en toda España.</p><div className="socials" aria-label="Redes sociales pendientes"><span title="Instagram · próximamente">ig</span><span title="TikTok · próximamente">tk</span></div></div><div className="footer-links"><div><strong>Empezar</strong><a href="#personalizador">Personalizador</a><a href="#presupuesto">Precios</a><Link href="/presupuesto">Pedir presupuesto</Link><Link href="/camisetas-personalizadas">Camisetas</Link></div><div><strong>Para grupos</strong><Link href="/sudaderas-personalizadas">Sudaderas personalizadas</Link><Link href="/sudaderas-colegios-institutos">Colegios e institutos</Link><Link href="/sudaderas-fin-de-curso">Fin de curso</Link><Link href="/sudaderas-penas">Peñas</Link><Link href="/sudaderas-viaje-estudios">Viajes de estudios</Link><Link href="/sudaderas-equipos-clubes">Equipos y clubes</Link></div><div><strong>Información</strong><Link href="/pedido">Entrar a un pedido</Link><a href="#como-funciona">Cómo funciona</a><a href="#preguntas">Preguntas</a><Link href="/privacidad">Privacidad</Link><Link href="/cookies">Cookies</Link><Link href="/condiciones">Condiciones</Link></div><div><strong>Contacto</strong><span>WhatsApp · se activará al lanzamiento</span><a href="mailto:pedidos@tusudaderaengrupo.es" onClick={() => void trackProductEvent("contact_email_clicked", { source: "footer" })}>pedidos@tusudaderaengrupo.es</a><span>Servicio para toda España</span></div></div><div className="footer-bottom"><small>© 2026 Tu sudadera en grupo</small><span>Hecho para pertenecer ✦</span><div><span>Datos fiscales pendientes antes del lanzamiento</span></div></div></footer>
    <CustomizerDrawer
      product={productName}
      model={productModel}
      color={garment.name}
      design={`${backDesignLabel} + ${frontDesignLabel}`}
      sleeve={sleeveFlag === "none" ? "Sin personalización" : `${selectedFlag}${sleeveDetail ? ` · ${sleeveDetail}` : ""}`}
      quantity={quantity}
      price={configuredUnitPrice === null ? "A consultar" : `${configuredUnitPrice} € / unidad`}
      onQuote={goToQuote}
    />
  </main>;
}

function FlagMark({type}:{type:string}){const label=type === "spain" ? "Bandera de España" : type === "community" ? "Bandera de la Comunidad Valenciana (ejemplo)" : type === "country" ? "Bandera de Francia (ejemplo)" : "Marca de manga";return <span className={`flag-mark ${type}`} data-flag={type} role="img" aria-label={label}><FlagIcon type={type} /></span>}
function FlagIcon({type}:{type:string}){if(type==="spain")return <svg viewBox="0 0 120 72" role="presentation" focusable="false"><rect width="120" height="72" fill="#AA151B"/><rect y="18" width="120" height="36" fill="#F1BF00"/></svg>;if(type==="community")return <svg viewBox="0 0 120 72" role="presentation" focusable="false"><rect width="120" height="72" fill="#F6CF00"/><rect x="25" width="95" height="7" y="6" fill="#C8202F"/><rect x="25" width="95" height="7" y="20" fill="#C8202F"/><rect x="25" width="95" height="7" y="34" fill="#C8202F"/><rect x="25" width="95" height="7" y="48" fill="#C8202F"/><rect x="25" width="95" height="7" y="62" fill="#C8202F"/><rect width="25" height="72" fill="#19508A"/></svg>;if(type==="country")return <svg viewBox="0 0 120 72" role="presentation" focusable="false"><rect width="40" height="72" fill="#1B3B79"/><rect x="40" width="40" height="72" fill="#FFFFFF"/><rect x="80" width="40" height="72" fill="#D52B3F"/></svg>;return <svg viewBox="0 0 120 72" role="presentation" focusable="false"><rect width="120" height="72" rx="4" fill="#17233F"/><path d="M12 36h96M60 12v48" stroke="#F1D35A" strokeWidth="7" strokeLinecap="round"/></svg>}
function BrandMark(){return <span className="brand-mark"><i>T</i><b>S</b><em>G</em></span>}
function StepHeader({number,title,text}:{number:string;title:string;text:string}){return <div className="step-header"><span>{number}</span><div><h2>{title}</h2><p>{text}</p></div></div>}
function NextButton({onClick,label}:{onClick:()=>void;label:string}){return <button type="button" className="next-button" onClick={onClick}><span><small>Siguiente paso</small>{label}</span><b><ArrowRight aria-hidden="true" /></b></button>}
function UploadDrop({title,text}:{title:string;text:string}){return <div className="upload-drop"><b><Upload aria-hidden="true" /></b><h3>{title}</h3><p>{text}</p><span>El archivo se adjunta en el siguiente paso →</span></div>}
function Hoodie({color,printColor,text,side,designStyle="default",frontType="name",frontText="PROMO",frontLogo="",sleeveFlag="",sleeveTechnique="print",onImageLoad}:{color:string;printColor:string;text:string;side:Side;designStyle?:string;frontType?:string;frontText?:string;frontLogo?:string;sleeveFlag?:string;sleeveTechnique?:string;onImageLoad?:()=>void}){const visual=CORE_COLORS.find(item=>item.value===color);const image=side==="front"?visual?.frontImage:visual?.backImage;return <div className="hoodie hoodie-real" style={{"--hoodie":color,"--print":printColor} as React.CSSProperties}>{image&&<Image unoptimized className="hoodie-real-asset" src={image} alt={visual?.name+" "+(side==="front"?"frontal":"trasera")} width={2000} height={2000} priority={side==="front"} sizes="(max-width: 768px) 94vw, 820px" onLoad={onImageLoad} />}{sleeveFlag&&<div className={`hoodie-sleeve-design ${sleeveTechnique} flag-preview`}><span className={`hoodie-flag ${sleeveFlag}`} data-flag={sleeveFlag} aria-label={sleeveFlag === "spain" ? "Bandera de España" : sleeveFlag === "community" ? "Bandera de la Comunidad Valenciana (ejemplo)" : sleeveFlag === "country" ? "Bandera de Francia (ejemplo)" : "Marca de manga"} aria-hidden="true"><FlagIcon type={sleeveFlag} /></span></div>}<div className="hoodie-body">{side==="back"?<div className={`hoodie-design back design-${designStyle}`}>{text.split("\n").map((line,index)=><span key={line+"-"+index}>{line}</span>)}</div>:<div className={`front-personalization ${frontType}`}>{frontType==="logo"?(frontLogo?<span className="uploaded-logo" role="img" aria-label="Logo subido" style={{backgroundImage:`url(${frontLogo})`}}/>:<><b>◇</b><span>LOGO</span></>):<span>{frontText||(frontType==="coordinates"?"COORDENADAS":"NOMBRE")}</span>}</div>}</div></div>}
function TShirt({color,printColor,text,side,frontType="name",frontText="PROMO"}:{color:string;printColor:string;text:string;side:Side;frontType?:string;frontText?:string}){return <div className="tshirt" style={{"--hoodie":color,"--print":printColor} as React.CSSProperties}><div className="tshirt-left-sleeve"/><div className="tshirt-right-sleeve"/><div className="tshirt-body"><span className="tshirt-collar"/>{side==="back"?<div className="hoodie-design back design-x">{text.split("\n").map((line,index)=><span key={`${line}-${index}`}>{line}</span>)}</div>:<div className={`front-personalization ${frontType}`}><span>{frontText||(frontType==="coordinates"?"37°53'N · 4°46'W":"NOMBRE")}</span></div>}</div></div>}
function ShowcaseCard({className="",number,eyebrow,title,text,design,color,print,onSelect}:{className?:string;number:string;eyebrow:string;title:string;text:string;design:string;color:string;print:string;onSelect:(design:string,title:string)=>void}){return <article className={`showcase-card ${className}`}><div className="showcase-copy"><span>{number} · {eyebrow}</span><h3>{title}</h3><p>{text}</p><button type="button" onClick={()=>onSelect(design,title)}>Usar como inicio <ArrowRight aria-hidden="true" /></button></div><div className="showcase-visual"><Hoodie color={color} printColor={print} text={design==="x"?"VUESTRO GRUPO\nX":design==="monument"?"MI PUEBLO\nPUEBLO & FIESTA":design==="group"?"LA PEÑA\nEL GRUPO":design==="collage"?"RECUERDOS\nLOCAL":"MASCOTA\nX ANIVERSARIO"} side="back" designStyle={design}/></div></article>}
