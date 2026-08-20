import Link from "next/link";

export function FlowBrand() {
  return <span className="flow-brand-mark"><i>T</i><b>S</b><em>G</em></span>;
}

export function FlowHeader({ current }: { current?: "quote" | "order" }) {
  return <header className="flow-header">
    <Link className="flow-brand" href="/" aria-label="Tu Sudadera en Grupo, volver al inicio">
      <FlowBrand />
      <span><strong>Tu sudadera</strong><small>en grupo</small></span>
    </Link>
    <nav aria-label="Navegación del proceso">
      <Link className={current === "quote" ? "active" : ""} href="/presupuesto">Pedir presupuesto</Link>
      <Link className={current === "order" ? "active" : ""} href="/pedido">Ya tengo un pedido</Link>
    </nav>
    <Link className="flow-back" href="/">Volver a la web <span>↗</span></Link>
  </header>;
}

export function FlowSteps({ active }: { active: 1 | 2 | 3 | 4 }) {
  const items = ["Diseñad", "Presupuesto", "Hablamos", "Pedido privado"];
  return <div className="flow-steps" aria-label="Proceso del pedido">
    {items.map((item, index) => <div key={item} className={active === index + 1 ? "active" : active > index + 1 ? "done" : ""}>
      <i>{active > index + 1 ? "✓" : String(index + 1).padStart(2, "0")}</i><span>{item}</span>
    </div>)}
  </div>;
}

export function FlowFooter() {
  return <footer className="flow-footer">
    <span>© 2026 Tu Sudadera en Grupo</span>
    <strong>pedidos@tusudaderaengrupo.es</strong>
    <span>Hecho para pertenecer ✦</span>
  </footer>;
}
