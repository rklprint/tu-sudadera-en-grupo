"use client";

import { useRef, useState } from "react";
import { trackProductEvent } from "@/lib/analytics";
import type { HostedPaymentForm, PaymentMethod } from "@/lib/payments/types";

type Availability = { card: boolean; bizum: boolean; transfer: boolean };
type TransferInstructions = { iban: string; accountHolder: string; concept: string };

export function PaymentCheckout({ scope, credential, amountCents, availability }: { scope: "participant" | "remaining"; credential: string; amountCents: number; availability: Availability }) {
  const [busy, setBusy] = useState<PaymentMethod | "">("");
  const [error, setError] = useState("");
  const [transfer, setTransfer] = useState<TransferInstructions | null>(null);
  const idempotencyKeys = useRef<Partial<Record<PaymentMethod, string>>>({});

  const start = async (method: "card" | "bizum" | "transfer") => {
    setBusy(method);
    setError("");
    setTransfer(null);
    void trackProductEvent("checkout_started", { payment_method: method, source: scope });
    void trackProductEvent("payment_method_selected", { payment_method: method });
    try {
      const idempotencyKey = idempotencyKeys.current[method] ||= crypto.randomUUID().replace(/-/g, "");
      const response = await fetch("/api/pagos/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(scope === "participant" ? { method, scope, participantToken: credential } : { method, scope, groupCode: credential }),
      });
      const result = await response.json() as { error?: string; retryable?: boolean; kind?: string; form?: HostedPaymentForm; instructions?: TransferInstructions };
      if (!response.ok) {
        if (result.retryable) delete idempotencyKeys.current[method];
        throw new Error(result.error || "No hemos podido iniciar el pago.");
      }
      if (result.kind === "transfer" && result.instructions) {
        setTransfer(result.instructions);
        void trackProductEvent("bank_transfer_selected", { payment_method: "transfer" });
        return;
      }
      if (result.kind !== "redsys" || !result.form) throw new Error("La respuesta del TPV no es válida.");
      void trackProductEvent("payment_started", { payment_method: method });
      submitHostedForm(result.form);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "No hemos podido iniciar el pago.");
      setBusy("");
    }
  };

  if (transfer) return <div className="transfer-instructions" role="status"><span>Transferencia pendiente de validación</span><h3>{formatMoney(amountCents)}</h3><dl><div><dt>Titular</dt><dd>{transfer.accountHolder}</dd></div><div><dt>IBAN</dt><dd>{transfer.iban}</dd></div><div><dt>Concepto obligatorio</dt><dd>{transfer.concept}</dd></div></dl><p>No se considerará pagado hasta que administración valide el ingreso.</p></div>;

  return <div className="checkout-panel">
    <div className="checkout-total"><span>{scope === "participant" ? "Total de tus prendas" : "Total pendiente del grupo"}</span><strong>{formatMoney(amountCents)}</strong></div>
    <div className="checkout-methods">
      <button type="button" disabled={!availability.card || !!busy} onClick={() => start("card")}><b>Tarjeta bancaria</b><span>{availability.card ? "Pago seguro en Redsys" : "Pendiente de activar"}</span></button>
      <button type="button" disabled={!availability.bizum || !!busy} onClick={() => start("bizum")}><b>Bizum</b><span>{availability.bizum ? "A través de Redsys" : "Pendiente del banco"}</span></button>
      <button type="button" disabled={!availability.transfer || !!busy} onClick={() => start("transfer")}><b>Transferencia</b><span>{availability.transfer ? "Validación manual" : "Pendiente de configurar"}</span></button>
    </div>
    {busy && <p className="checkout-status" role="status">Preparando {busy === "card" ? "el pago con tarjeta" : busy === "bizum" ? "Bizum" : "la transferencia"}…</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <small>No introducimos ni almacenamos datos de tarjeta: el cobro se realiza en la página segura de Redsys.</small>
  </div>;
}

function submitHostedForm(hosted: HostedPaymentForm) {
  const form = document.createElement("form");
  form.method = hosted.method;
  form.action = hosted.action;
  for (const [name, value] of Object.entries(hosted.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

function formatMoney(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".00", "").replace(".", ",")} €`;
}
