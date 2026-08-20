"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlowFooter, FlowHeader, FlowSteps } from "@/app/_components/flow-shell";

export default function OrderAccessPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized) router.push(`/pedido/${encodeURIComponent(normalized)}`);
  };

  return <main className="flow-page order-access-page">
    <FlowHeader current="order" />
    <FlowSteps active={4} />
    <section className="order-access-shell">
      <div className="order-access-copy">
        <p className="flow-eyebrow">Acceso privado</p>
        <h1>Vuestro grupo,<br /><em>todo en orden.</em></h1>
        <p>Este acceso solo se crea después de hablar con nosotros y aprobar la propuesta. Primero se registran las prendas; el pago se abre cuando organizador y equipo cierran la cantidad real.</p>
        <ul><li>Configurar cada prenda por separado</li><li>Editar desde un enlace enviado por correo</li><li>Combinar pagos individuales y del organizador</li><li>Consultar solo los totales generales</li></ul>
      </div>
      <div className="order-code-card">
        <span className="lock-icon">⌁</span>
        <h2>Introducid vuestro código</h2>
        <p>Aparece en el enlace privado enviado al organizador.</p>
        <form onSubmit={submit}><label><span>Código del pedido</span><input required value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="TSG-000000" autoCapitalize="characters" /></label><button type="submit">Acceder <span>↗</span></button></form>
        <div className="access-help"><span>¿Todavía no tenéis código?</span><Link href="/presupuesto">Pedir presupuesto</Link></div>
        <Link className="demo-order-link" href="/pedido/TSG-DEMO" rel="nofollow">Ver pedido de demostración →</Link>
      </div>
    </section>
    <FlowFooter />
  </main>;
}
