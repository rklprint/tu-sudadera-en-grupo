import assert from "node:assert/strict";
import test from "node:test";
import { decodeMerchantParameters, encodeMerchantParameters, signRedsysParameters } from "../lib/payments/redsys";

test("firma HMAC_SHA512_V2 igual que el vector oficial de Redsys", async () => {
  const merchantParameters = "eyJEU19NRVJDSEFOVF9BTU9VTlQiOiI5OTkiLCJEU19NRVJDSEFOVF9PUkRFUiI6IjEyMzQ1Njc4OTAiLCJEU19NRVJDSEFOVF9NRVJDSEFOVENPREUiOiI5OTkwMDg4ODEiLCJEU19NRVJDSEFOVF9DVVJSRU5DWSI6Ijk3OCIsIkRTX01FUkNIQU5UX1RSQU5TQUNUSU9OVFlQRSI6IjAiLCJEU19NRVJDSEFOVF9URVJNSU5BTCI6IjEiLCJEU19NRVJDSEFOVF9NRVJDSEFOVFVSTCI6Imh0dHA6XC9cL3d3dy5wcnVlYmEuY29tXC91cmxOb3RpZmljYWNpb24ucGhwIiwiRFNfTUVSQ0hBTlRfVVJMT0siOiJodHRwOlwvXC93d3cucHJ1ZWJhLmNvbVwvdXJsT0sucGhwIiwiRFNfTUVSQ0hBTlRfVVJMS08iOiJodHRwOlwvXC93d3cucHJ1ZWJhLmNvbVwvdXJsS08ucGhwIn0";
  const signature = await signRedsysParameters(merchantParameters, "1234567890", "sq7HjrUOBfKmC576ILgskD5srU870gJ7");
  assert.equal(signature, "Vjo02eSWq249IeZZp3R-ArFnGLhKY0OuzDDlx1BuVtZDC2yhczA7_11uZhsYzLZBCMFAz8u8uzGDX3AErHKmmw");
});

test("los parámetros se codifican y decodifican en base64url", () => {
  const input = { DS_MERCHANT_ORDER: "1234567890", DS_MERCHANT_AMOUNT: "999" };
  assert.deepEqual(decodeMerchantParameters(encodeMerchantParameters(input)), input);
});
