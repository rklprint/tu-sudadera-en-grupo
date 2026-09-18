import assert from "node:assert/strict";
import test from "node:test";
import { createMerchantOrder, createPaymentCancellationToken, decodeMerchantParameters, encodeMerchantParameters, getRedsysConfig, parseAndVerifyRedsysNotification, signRedsysParameters, verifyPaymentCancellationToken } from "../lib/payments/redsys";
import { setSiteRuntimeEnv } from "../lib/runtime-env";

test("genera referencias Redsys numéricas, válidas y no reutilizadas", () => {
  const orders = Array.from({ length: 256 }, () => createMerchantOrder());
  assert.equal(new Set(orders).size, orders.length);
  for (const order of orders) assert.match(order, /^\d{12}$/);
});

test("no inventa un terminal cuando el banco todavía no lo ha facilitado", () => {
  setSiteRuntimeEnv({
    REDSYS_ENVIRONMENT: "test",
    REDSYS_MERCHANT_CODE: "999008881",
    REDSYS_SIGNING_KEY: "sandbox-key-only-for-tests",
  });
  assert.equal(getRedsysConfig(), null);
});

test("firma HMAC_SHA512_V2 igual que el vector oficial de Redsys", async () => {
  const merchantParameters = "eyJEU19NRVJDSEFOVF9BTU9VTlQiOiI5OTkiLCJEU19NRVJDSEFOVF9PUkRFUiI6IjEyMzQ1Njc4OTAiLCJEU19NRVJDSEFOVF9NRVJDSEFOVENPREUiOiI5OTkwMDg4ODEiLCJEU19NRVJDSEFOVF9DVVJSRU5DWSI6Ijk3OCIsIkRTX01FUkNIQU5UX1RSQU5TQUNUSU9OVFlQRSI6IjAiLCJEU19NRVJDSEFOVF9URVJNSU5BTCI6IjEiLCJEU19NRVJDSEFOVF9NRVJDSEFOVFVSTCI6Imh0dHA6XC9cL3d3dy5wcnVlYmEuY29tXC91cmxOb3RpZmljYWNpb24ucGhwIiwiRFNfTUVSQ0hBTlRfVVJMT0siOiJodHRwOlwvXC93d3cucHJ1ZWJhLmNvbVwvdXJsT0sucGhwIiwiRFNfTUVSQ0hBTlRfVVJMS08iOiJodHRwOlwvXC93d3cucHJ1ZWJhLmNvbVwvdXJsS08ucGhwIn0";
  const signature = await signRedsysParameters(merchantParameters, "1234567890", "sq7HjrUOBfKmC576ILgskD5srU870gJ7");
  assert.equal(signature, "Vjo02eSWq249IeZZp3R-ArFnGLhKY0OuzDDlx1BuVtZDC2yhczA7_11uZhsYzLZBCMFAz8u8uzGDX3AErHKmmw");
});

test("los parámetros se codifican y decodifican en base64url", () => {
  const input = { DS_MERCHANT_ORDER: "1234567890", DS_MERCHANT_AMOUNT: "999" };
  assert.deepEqual(decodeMerchantParameters(encodeMerchantParameters(input)), input);
});

test("verifica notificación servidor-servidor y rechaza manipulaciones", async () => {
  const config = { environment: "test" as const, merchantCode: "999008881", terminal: "001", signingKey: "sq7HjrUOBfKmC576ILgskD5srU870gJ7" };
  const raw = { Ds_Order: "1234567890", Ds_Amount: "2600", Ds_Currency: "978", Ds_MerchantCode: "999008881", Ds_Terminal: "001", Ds_Response: "0000", Ds_AuthorisationCode: "E2E001", Ds_MerchantData: "TSG-E2E" };
  const parameters = encodeMerchantParameters(raw);
  const signature = await signRedsysParameters(parameters, raw.Ds_Order, config.signingKey);
  const parsed = await parseAndVerifyRedsysNotification("HMAC_SHA512_V2", parameters, signature, config);
  assert.equal(parsed.successful, true);
  assert.equal(parsed.amountCents, 2600);
  const tampered = encodeMerchantParameters({ ...raw, Ds_Amount: "999999" });
  await assert.rejects(() => parseAndVerifyRedsysNotification("HMAC_SHA512_V2", tampered, signature, config), /signature/i);
});

test("la cancelación del navegador requiere un token ligado a la referencia", async () => {
  const key = "sandbox-key-only-for-tests";
  const token = await createPaymentCancellationToken("TSG-PAY-1", key);
  assert.equal(await verifyPaymentCancellationToken("TSG-PAY-1", token, key), true);
  assert.equal(await verifyPaymentCancellationToken("TSG-PAY-2", token, key), false);
  assert.equal(await verifyPaymentCancellationToken("TSG-PAY-1", `${token}x`, key), false);
});
