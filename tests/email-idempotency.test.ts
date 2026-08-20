import assert from "node:assert/strict";
import test from "node:test";
import { sendPaymentReceiptEmail } from "../lib/order-emails";

type RuntimeGlobal = typeof globalThis & {
  __TSG_SITE_RUNTIME_ENV__?: Record<string, string>;
};

test("los justificantes usan una clave estable de idempotencia de Resend", async () => {
  const runtime = globalThis as RuntimeGlobal;
  const originalFetch = globalThis.fetch;
  const headersSeen: string[] = [];
  runtime.__TSG_SITE_RUNTIME_ENV__ = {
    RESEND_API_KEY: "test-key",
    QUOTE_FROM_EMAIL: "Tu Sudadera <test@example.invalid>",
  };
  globalThis.fetch = async (_input, init) => {
    const headers = new Headers(init?.headers);
    headersSeen.push(headers.get("Idempotency-Key") || "");
    return new Response("{}", { status: 200 });
  };

  try {
    await sendPaymentReceiptEmail({
      to: "participant@example.invalid",
      contactName: "Fixture",
      groupName: "Grupo fixture",
      reference: "TSG-PAYMENT-1",
      amountCents: 2_600,
      orderUrl: "https://example.invalid/pedido/TSG-GROUP",
    });
    await sendPaymentReceiptEmail({
      to: "participant@example.invalid",
      contactName: "Fixture",
      groupName: "Grupo fixture",
      reference: "TSG-PAYMENT-1",
      amountCents: 2_600,
      orderUrl: "https://example.invalid/pedido/TSG-GROUP",
    });
  } finally {
    globalThis.fetch = originalFetch;
    delete runtime.__TSG_SITE_RUNTIME_ENV__;
  }

  assert.deepEqual(headersSeen, ["payment-receipt:TSG-PAYMENT-1", "payment-receipt:TSG-PAYMENT-1"]);
});
