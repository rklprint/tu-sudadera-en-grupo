"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FlowFooter, FlowHeader } from "@/app/_components/flow-shell";
import { trackProductEvent } from "@/lib/analytics";

function PaymentResultContent() {
  const query = useSearchParams();
  const reference = String(query.get("ref") || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
  const returnedState = query.get("estado") === "cancelado" ? "cancelado" : "pendiente";
  const cancellationToken = String(query.get("token") || "").slice(0, 180);
  const [status, setStatus] = useState<"loading" | "processing" | "confirmed" | "failed" | "cancelled" | "unknown">(reference ? "loading" : "unknown");

  useEffect(() => {
    if (!reference) return;
    let attempts = 0;
    let timeout = 0;
    const check = async () => {
      attempts += 1;
      try {
        if (attempts === 1 && returnedState === "cancelado" && cancellationToken) {
          await fetch(`/api/pagos/${encodeURIComponent(reference)}/cancelar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: cancellationToken }),
          });
        }
        const response = await fetch(`/api/pagos/${encodeURIComponent(reference)}/estado`, { cache: "no-store" });
        const result = await response.json() as { status?: string };
        if (!response.ok || !result.status) throw new Error("unknown");
        if (result.status === "confirmed") {
          setStatus("confirmed");
          void trackProductEvent("payment_completed", { payment_status: "confirmed" });
          return;
        }
        if (["failed", "rejected"].includes(result.status)) {
          setStatus("failed");
          void trackProductEvent("payment_failed", { payment_status: result.status });
          return;
        }
        if (result.status === "cancelled") { setStatus("cancelled"); return; }
        setStatus("processing");
        if (attempts < 8) timeout = window.setTimeout(check, 1800);
      } catch {
        setStatus("unknown");
      }
    };
    void check();
    return () => window.clearTimeout(timeout);
  }, [cancellationToken, reference, returnedState]);

  const confirmed = status === "confirmed";
  const cancelled = status === "cancelled";
  return <main className="flow-page payment-result-page"><FlowHeader current="order" /><section className={`order-state-card ${confirmed ? "success-state" : status === "failed" || cancelled ? "error-state" : ""}`}><span>{confirmed ? "✓" : status === "failed" || cancelled ? "!" : "···"}</span><p className="flow-eyebrow">Referencia {reference || "no disponible"}</p><h1>{confirmed ? <>Pago<br /><em>confirmado.</em></> : cancelled ? <>Pago<br /><em>cancelado.</em></> : status === "failed" ? <>Pago no<br /><em>completado.</em></> : <>Estamos verificando<br /><em>el pago.</em></>}</h1><p>{confirmed ? "La notificación segura de Redsys ha sido validada. Recibirás el justificante por correo." : cancelled ? "La operación se ha cancelado y no se ha marcado como pagada. Puedes iniciar un nuevo intento." : status === "failed" ? "Redsys no ha autorizado la operación. No la hemos marcado como pagada." : "Volver a esta página no confirma un cobro: esperamos la notificación firmada de Redsys antes de actualizar el pedido."}</p><div><Link className="primary-flow-action" href="/pedido">Volver al pedido</Link></div></section><FlowFooter /></main>;
}

export default function PaymentResultPage() { return <Suspense fallback={<main className="flow-page"><section className="order-loading"><i /><p>Verificando el pago…</p></section></main>}><PaymentResultContent /></Suspense>; }
