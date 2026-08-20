"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlowFooter, FlowHeader } from "@/app/_components/flow-shell";
import { GarmentEditor, newGarment, type GarmentDraft } from "@/app/_components/garment-editor";

type SizeCount = { size: string; quantity: number };
type OrderData = {
  kind: "quote" | "approved";
  code: string;
  status: string;
  phase?: "registration" | "payment" | "production" | "closed";
  groupName: string;
  garment: string;
  color: string;
  estimatedQuantity: number;
  location?: string;
  createdAt?: string;
  unitPriceCents?: number;
  deadline?: string;
  designStatus?: string;
  registrationStatus?: string;
  paymentStatus?: string;
  productionStatus?: string;
  registeredPeople?: number;
  registeredGarments?: number;
  paidPeople?: number;
  paidGarments?: number;
  amountCollectedCents?: number;
  amountOutstandingCents?: number;
  sizeDistribution?: SizeCount[];
};

type RegistrationResult = { ok?: boolean; error?: string; emailStatus?: string; editUrl?: string; garments?: number };

const money = (cents = 0) => `${(cents / 100).toFixed(2).replace(".00", "").replace(".", ",")} €`;

export default function PrivateOrderPage() {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [garments, setGarments] = useState<GarmentDraft[]>([newGarment()]);
  const [saving, setSaving] = useState(false);
  const [registration, setRegistration] = useState<RegistrationResult | null>(null);

  const pathname = usePathname();
  const code = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "").toUpperCase();

  const loadOrder = (accessCode = code) => fetch(`/api/pedidos/${encodeURIComponent(accessCode)}`)
    .then(async response => {
      const result = await response.json() as OrderData & { error?: string };
      if (!response.ok) throw new Error(result.error || "No encontramos este pedido.");
      setOrder(result);
    })
    .catch(fetchError => setError(fetchError instanceof Error ? fetchError.message : "No encontramos este pedido."));

  useEffect(() => {
    if (code) void loadOrder(code);
  // The route code is stable for the lifetime of this page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const register = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setRegistration(null);
    try {
      const response = await fetch(`/api/pedidos/${encodeURIComponent(code)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactName, email, garments }),
      });
      const result = await response.json() as RegistrationResult;
      if (!response.ok) throw new Error(result.error || "No hemos podido guardar el registro.");
      setRegistration(result);
      if (!result.editUrl?.includes("TSG-DEMO")) void loadOrder();
    } catch (registerError) {
      setRegistration({ error: registerError instanceof Error ? registerError.message : "No hemos podido guardar el registro." });
    } finally {
      setSaving(false);
    }
  };

  if (error) return <main className="flow-page private-order-page"><FlowHeader current="order" /><section className="order-state-card error-state"><span>?</span><p className="flow-eyebrow">Enlace no encontrado</p><h1>Este acceso no<br /><em>parece correcto.</em></h1><p>{error}</p><div><Link className="primary-flow-action" href="/pedido">Probar otro código</Link><Link href="/presupuesto">Pedir presupuesto</Link></div></section><FlowFooter /></main>;
  if (!order) return <main className="flow-page private-order-page"><FlowHeader current="order" /><section className="order-loading"><i /><p>Buscando vuestro grupo…</p></section><FlowFooter /></main>;

  if (order.kind === "quote") {
    return <main className="flow-page private-order-page">
      <FlowHeader current="order" />
      <section className="quote-status-layout">
        <div className="quote-status-copy"><p className="flow-eyebrow">Referencia {order.code}</p><h1>Vuestra idea está<br /><em>en buenas manos.</em></h1><p>La solicitud está registrada, pero el grupo todavía no está abierto. Primero revisaremos la propuesta, la maqueta y el precio con el organizador.</p></div>
        <div className="status-board"><div className="status-board-top"><span>Estado actual</span><strong>Solicitud recibida</strong><i>En revisión</i></div><div className="status-order-summary"><p><span>Grupo</span><b>{order.groupName}</b></p><p><span>Modelo</span><b>{order.garment}</b></p><p><span>Color</span><b>{order.color}</b></p><p><span>Cantidad aproximada</span><b>{order.estimatedQuantity}</b></p></div><div className="status-steps"><div className="done"><i>✓</i><span><b>Solicitud registrada</b><small>Completado</small></span></div><div className="active"><i>02</i><span><b>Conversación y diseño</b><small>Respuesta en menos de 24 h laborables</small></span></div><div><i>03</i><span><b>Propuesta aprobada</b><small>Diseño, cantidad y precio</small></span></div><div><i>04</i><span><b>Registro del grupo</b><small>Enlace privado automático</small></span></div></div><p className="status-contact">Las novedades llegarán al organizador por correo y, al lanzamiento, también por WhatsApp.</p></div>
      </section>
      <FlowFooter />
    </main>;
  }

  const registeredPeople = order.registeredPeople || 0;
  const registeredGarments = order.registeredGarments || 0;
  const progress = order.estimatedQuantity ? Math.min(100, Math.round((registeredGarments / order.estimatedQuantity) * 100)) : 0;
  const unitPrice = order.unitPriceCents || 0;

  return <main className="flow-page private-order-page">
    <FlowHeader current="order" />
    <section className="group-workspace">
      <header className="group-workspace-head">
        <div><p className="flow-eyebrow">Acceso privado · {order.code}</p><h1>{order.groupName}</h1><p>{order.garment} · {order.color} · Base {money(unitPrice)} / prenda</p></div>
        <div className="group-workspace-meta">{order.deadline && <span className="deadline-pill"><small>Fecha límite</small><b>{order.deadline}</b></span>}<div className={`phase-pill phase-${order.phase}`}><i />{phaseLabel(order.phase)}</div></div>
      </header>

      <div className="group-phase-track" aria-label="Progreso del pedido">
        <div className="done"><span>✓</span><b>Diseño aprobado</b></div>
        <div className={order.phase === "registration" ? "active" : "done"}><span>02</span><b>Registro</b></div>
        <div className={order.phase === "payment" ? "active" : order.phase === "production" ? "done" : ""}><span>03</span><b>Pago</b></div>
        <div className={order.phase === "production" ? "active" : ""}><span>04</span><b>Producción</b></div>
      </div>

      <section className="aggregate-board" aria-label="Resumen general del grupo">
        <article><span>Personas registradas</span><strong>{registeredPeople}</strong><small>Solo totales, sin datos personales</small></article>
        <article><span>Prendas registradas</span><strong>{registeredGarments}</strong><small>Objetivo inicial: {order.estimatedQuantity}</small></article>
        <article><span>Personas que han pagado</span><strong>{order.paidPeople || 0}</strong><small>El pago aún {order.paymentStatus === "open" ? "está abierto" : "no está abierto"}</small></article>
        <article><span>Cobrado / pendiente</span><strong>{money(order.amountCollectedCents)} <em>/ {money(order.amountOutstandingCents)}</em></strong><small>Según las prendas registradas</small></article>
      </section>

      <div className="group-capacity"><div><span>Registro actual</span><b>{registeredGarments} de {order.estimatedQuantity} prendas previstas</b></div><div className="large-progress"><i style={{ width: `${progress}%` }} /></div><small>{progress}% de la previsión · el tramo se recalcula al cerrar</small></div>

      {order.phase === "registration" && <section className="registration-layout">
        <aside className="registration-context">
          <p className="flow-eyebrow">Fase 1 · sin pago</p><h2>Registra tus prendas.</h2><p>Añade una ficha por sudadera. Cada una puede llevar una talla, nombre y extras distintos. Podrás corregirlo desde el enlace privado enviado por correo hasta que hagas el pago.</p>
          <dl><div><dt>Incluido</dt><dd>DTF pecho hasta A5 + espalda hasta A3</dd></div><div><dt>También incluido</dt><dd>Nombre individual en pecho o espalda</dd></div><div><dt>Importante</dt><dd>Ahora no se realiza ningún cobro</dd></div></dl>
          <div className="size-mini-board"><span>Distribución actual de tallas</span>{(order.sizeDistribution || []).length ? order.sizeDistribution?.map(item => <p key={item.size}><b>{item.size}</b><i style={{ width: `${Math.max(8, (item.quantity / Math.max(1, registeredGarments)) * 100)}%` }} /><strong>{item.quantity}</strong></p>) : <small>Aparecerá cuando el grupo empiece a registrarse.</small>}</div>
        </aside>

        <div className="registration-card">
          {registration?.ok ? <div className="registration-success"><span>✓</span><p className="flow-eyebrow">Registro guardado</p><h2>{registration.garments} {registration.garments === 1 ? "prenda está lista" : "prendas están listas"}.</h2><p>{registration.emailStatus === "sent" ? "Hemos enviado el enlace de edición a tu correo." : registration.emailStatus === "demo" ? "Esta es una demostración: puedes abrir el enlace de edición sin enviar ningún correo real." : "Tu selección está guardada. El correo automático se activará al configurar el servicio de envío."}</p>{registration.editUrl && <a className="primary-flow-action" href={registration.editUrl}>Revisar mis prendas →</a>}<button type="button" onClick={() => { setRegistration(null); setContactName(""); setEmail(""); setGarments([newGarment()]); }}>Registrar otra persona</button></div> : <form onSubmit={register}>
            <header><div><span>Tu selección</span><h2>Datos de contacto</h2></div><strong>No se comparten con el organizador</strong></header>
            <div className="participant-fields"><label><span>Nombre de contacto</span><input required value={contactName} onChange={event => setContactName(event.target.value)} maxLength={80} autoComplete="name" /></label><label><span>Correo para tu enlace privado</span><input required type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={160} autoComplete="email" /></label></div>
            <GarmentEditor garments={garments} onChange={setGarments} unitPriceCents={unitPrice} disabled={saving} />
            {registration?.error && <p className="form-error" role="alert">{registration.error}</p>}
            <button className="registration-submit" disabled={saving} type="submit"><span>{saving ? "Guardando…" : "Guardar mi registro"}<small>Recibirás un enlace para editarlo</small></span><b>↗</b></button>
            <p className="privacy-note">Tus datos se utilizan únicamente para gestionar este pedido. El organizador solo ve totales generales.</p>
          </form>}
        </div>
      </section>}

      {order.phase === "payment" && <PaymentPhase order={order} />}
      {order.phase === "closed" && <WaitingPhase />}
      {order.phase === "production" && <ProductionPhase order={order} />}
    </section>
    <FlowFooter />
  </main>;
}

function phaseLabel(phase?: OrderData["phase"]) {
  if (phase === "payment") return "Pagos abiertos";
  if (phase === "production") return "En producción";
  if (phase === "closed") return "Registro cerrado";
  return "Registro abierto";
}

function PaymentPhase({ order }: { order: OrderData }) {
  return <section className="payment-phase-card"><div><p className="flow-eyebrow">Fase 2 · precio fijado</p><h2>El grupo ya puede pagar.</h2><p>Los pagos individuales y el pago final del organizador pueden convivir. Cada pago queda vinculado a este pedido y el precio se ha calculado con las unidades realmente registradas.</p><div className="payment-method-list"><span>Tarjeta bancaria</span><span>Bizum</span><span>Transferencia</span><span>Saldo del organizador</span></div></div><aside><span>Importe base por prenda</span><strong>{money(order.unitPriceCents)}</strong><p>Los extras individuales se suman en cada selección.</p><button disabled>Pasarela pendiente de activación</button><small>No se realizará ningún cargo hasta conectar y verificar el TPV definitivo.</small></aside></section>;
}

function WaitingPhase() {
  return <section className="phase-message"><span>02</span><div><p className="flow-eyebrow">Registro cerrado</p><h2>Estamos fijando el precio definitivo.</h2><p>El organizador y nuestro equipo revisan la cantidad real y cualquier bordado a consultar. En cuanto quede aprobado, se abrirá el pago desde este mismo enlace.</p></div></section>;
}

function ProductionPhase({ order }: { order: OrderData }) {
  return <section className="phase-message production-message"><span>✓</span><div><p className="flow-eyebrow">Pedido completamente pagado</p><h2>{order.productionStatus === "shipped" ? "Vuestro pedido está en camino." : "Las sudaderas ya están en producción."}</h2><p>El plazo habitual es de 10–15 días laborables. El seguimiento del envío conjunto se comunica únicamente al organizador.</p></div></section>;
}
