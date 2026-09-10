import Link from "next/link";
import { FlowFooter, FlowHeader } from "@/app/_components/flow-shell";

export default function NotFound() { return <main className="flow-page"><FlowHeader /><section className="order-state-card error-state"><span>404</span><p className="flow-eyebrow">Página no encontrada</p><h1>Esta ruta no<br /><em>lleva al grupo.</em></h1><p>Puede que el enlace haya cambiado, sea privado o esté incompleto.</p><div><Link className="primary-flow-action" href="/">Volver al inicio</Link><Link href="/presupuesto">Pedir presupuesto</Link></div></section><FlowFooter /></main>; }
