"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FlowFooter, FlowHeader, FlowSteps } from "@/app/_components/flow-shell";

function QuoteReceivedContent() {
  const query = useSearchParams();
  const value = query.get("ref");
  const mailStatus = query.get("mail");
  const reference = value ? value.toUpperCase().slice(0, 40) : "TSG-PENDIENTE";

  return <main className="flow-page received-page">
    <FlowHeader current="quote" />
    <FlowSteps active={3} />
    <section className="received-card">
      <div className="received-badge">✓</div>
      <p className="flow-eyebrow">Solicitud registrada</p>
      <h1>Ahora empieza<br /><em>la parte buena.</em></h1>
      <p>{mailStatus === "sent" ? "Os hemos enviado una confirmación por correo." : "La solicitud está guardada correctamente; la confirmación automática por correo está pendiente de activación."} Revisaremos la idea y responderemos personalmente en menos de 24 horas laborables. Todavía no hay ningún pago abierto.</p>
      <div className="reference-box"><span>Vuestra referencia</span><strong>{reference}</strong><small>Guardadla para consultar el estado de la solicitud.</small></div>
      <div className="received-actions"><Link className="primary-flow-action" href={`/pedido/${encodeURIComponent(reference)}`}>Consultar solicitud <span>↗</span></Link><span className="whatsapp-pending" aria-disabled="true">WhatsApp · se activará al lanzamiento</span><Link href="/">Volver al inicio</Link></div>
      <div className="received-timeline"><div className="done"><i>✓</i><span><b>Idea recibida</b><small>Ya está registrada</small></span></div><div><i>02</i><span><b>Hablamos por WhatsApp</b><small>Diseño, cantidad y fecha</small></span></div><div><i>03</i><span><b>Aprobáis la propuesta</b><small>Precio final sin sorpresas</small></span></div><div><i>04</i><span><b>Abrimos el pedido</b><small>Tallas y pagos privados</small></span></div></div>
    </section>
    <FlowFooter />
  </main>;
}

export default function QuoteReceivedPage() {
  return <Suspense fallback={<main className="flow-page received-page"><FlowHeader current="quote" /><section className="order-loading"><i /><p>Preparando la confirmación…</p></section><FlowFooter /></main>}><QuoteReceivedContent /></Suspense>;
}
