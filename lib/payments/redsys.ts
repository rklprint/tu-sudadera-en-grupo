import { getSiteRuntimeEnv } from "@/lib/runtime-env";
import type { HostedPaymentForm, PaymentProvider } from "@/lib/payments/types";

export const REDSYS_SIGNATURE_VERSION = "HMAC_SHA512_V2" as const;
export const REDSYS_TEST_URL = "https://sis-t.redsys.es:25443/sis/realizarPago";
export const REDSYS_PRODUCTION_URL = "https://sis.redsys.es/sis/realizarPago";

export type RedsysConfig = {
  environment: "test" | "production";
  merchantCode: string;
  terminal: string;
  signingKey: string;
};

export type RedsysNotification = {
  order: string;
  amountCents: number;
  currency: string;
  merchantCode: string;
  terminal: string;
  responseCode: string;
  authorizationCode: string;
  merchantData: string;
  successful: boolean;
  raw: Record<string, unknown>;
  payloadHash: string;
};

export function getRedsysConfig(): RedsysConfig | null {
  const env = getSiteRuntimeEnv();
  const environment = env.REDSYS_ENVIRONMENT === "production" ? "production" : "test";
  const merchantCode = String(env.REDSYS_MERCHANT_CODE || "").trim();
  const terminal = String(env.REDSYS_TERMINAL || "").trim();
  const signingKey = String(env.REDSYS_SIGNING_KEY || "").trim();
  if (!/^\d{9}$/.test(merchantCode) || !/^\d{1,3}$/.test(terminal) || !signingKey) return null;
  return { environment, merchantCode, terminal: terminal.padStart(3, "0"), signingKey };
}

export function createRedsysProvider(config: RedsysConfig): PaymentProvider {
  return {
    name: "redsys",
    async createHostedPayment(input) {
      if (!/^[a-zA-Z0-9]{4,12}$/.test(input.merchantOrder)) throw new Error("Redsys merchant order is invalid");
      if (!Number.isInteger(input.amountCents) || input.amountCents < 1 || input.amountCents > 999_999_999_999) throw new Error("Redsys amount is invalid");
      for (const target of [input.notificationUrl, input.successUrl, input.cancelUrl]) {
        if (new URL(target).protocol !== "https:") throw new Error("Redsys callback URLs must use HTTPS");
      }

      const parameters: Record<string, string> = {
        DS_MERCHANT_AMOUNT: String(input.amountCents),
        DS_MERCHANT_ORDER: input.merchantOrder,
        DS_MERCHANT_MERCHANTCODE: config.merchantCode,
        DS_MERCHANT_CURRENCY: "978",
        DS_MERCHANT_TRANSACTIONTYPE: "0",
        DS_MERCHANT_TERMINAL: config.terminal,
        DS_MERCHANT_MERCHANTURL: input.notificationUrl,
        DS_MERCHANT_URLOK: input.successUrl,
        DS_MERCHANT_URLKO: input.cancelUrl,
        DS_MERCHANT_MERCHANTDATA: input.merchantData.slice(0, 1024),
      };
      if (input.method === "bizum") parameters.DS_MERCHANT_PAYMETHODS = "z";
      const merchantParameters = encodeMerchantParameters(parameters);
      const signature = await signRedsysParameters(merchantParameters, input.merchantOrder, config.signingKey);

      return {
        provider: "redsys",
        action: config.environment === "production" ? REDSYS_PRODUCTION_URL : REDSYS_TEST_URL,
        method: "POST",
        fields: {
          Ds_SignatureVersion: REDSYS_SIGNATURE_VERSION,
          Ds_MerchantParameters: merchantParameters,
          Ds_Signature: signature,
        },
      } satisfies HostedPaymentForm;
    },
  };
}

export function createMerchantOrder() {
  // Redsys accepts at most 12 alphanumeric characters and requires the first
  // four to be numeric. Keep the whole value numeric, add a small temporal
  // prefix for diagnostics and retain ~33 bits of cryptographic randomness.
  const random = crypto.getRandomValues(new Uint8Array(5));
  const randomValue = random.reduce((value, byte) => value * 256 + byte, 0) % 10_000_000_000;
  return `${String(Date.now()).slice(-2)}${String(randomValue).padStart(10, "0")}`;
}

export async function signRedsysParameters(merchantParameters: string, order: string, signingKey: string) {
  const encoder = new TextEncoder();
  const normalizedKey = signingKey.slice(0, 16).padEnd(16, "0");
  if (encoder.encode(normalizedKey).byteLength !== 16) throw new Error("Redsys signing key must contain single-byte characters");

  const aesKey = await crypto.subtle.importKey("raw", encoder.encode(normalizedKey), { name: "AES-CBC" }, false, ["encrypt"]);
  const diversified = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-CBC", iv: new Uint8Array(16) }, aesKey, encoder.encode(order)));
  const diversifiedBase64 = bytesToBase64(diversified);
  const hmacKey = await crypto.subtle.importKey("raw", encoder.encode(diversifiedBase64), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", hmacKey, encoder.encode(merchantParameters)));
  return bytesToBase64Url(signature);
}

export async function createPaymentCancellationToken(reference: string, signingKey: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`cancel:${reference}`),
  ));
  return bytesToBase64Url(signature);
}

export async function verifyPaymentCancellationToken(reference: string, token: string, signingKey: string) {
  if (!token || token.length > 256) return false;
  return constantTimeEqual(await createPaymentCancellationToken(reference, signingKey), token);
}

export async function parseAndVerifyRedsysNotification(
  signatureVersion: string,
  merchantParameters: string,
  receivedSignature: string,
  config: RedsysConfig,
): Promise<RedsysNotification> {
  if (signatureVersion !== REDSYS_SIGNATURE_VERSION) throw new Error("Unsupported Redsys signature version");
  if (!merchantParameters || merchantParameters.length > 32_000 || !receivedSignature || receivedSignature.length > 512) throw new Error("Malformed Redsys notification");
  const raw = decodeMerchantParameters(merchantParameters);
  const order = readRedsysString(raw, "Ds_Order", "DS_ORDER");
  if (!/^[a-zA-Z0-9]{4,12}$/.test(order)) throw new Error("Invalid Redsys order");
  const expectedSignature = await signRedsysParameters(merchantParameters, order, config.signingKey);
  if (!constantTimeEqual(expectedSignature, receivedSignature)) throw new Error("Invalid Redsys signature");

  const amount = readRedsysString(raw, "Ds_Amount", "DS_AMOUNT");
  const responseCode = readRedsysString(raw, "Ds_Response", "DS_RESPONSE");
  const amountCents = Number(amount);
  if (!Number.isSafeInteger(amountCents) || amountCents < 1) throw new Error("Invalid Redsys amount");
  if (!/^\d{4}$/.test(responseCode)) throw new Error("Invalid Redsys response code");
  const responseNumber = Number(responseCode);

  return {
    order,
    amountCents,
    currency: readRedsysString(raw, "Ds_Currency", "DS_CURRENCY"),
    merchantCode: readRedsysString(raw, "Ds_MerchantCode", "DS_MERCHANTCODE"),
    terminal: readRedsysString(raw, "Ds_Terminal", "DS_TERMINAL"),
    responseCode,
    authorizationCode: readRedsysString(raw, "Ds_AuthorisationCode", "DS_AUTHORISATIONCODE"),
    merchantData: readRedsysString(raw, "Ds_MerchantData", "DS_MERCHANTDATA"),
    successful: responseNumber >= 0 && responseNumber <= 99,
    raw,
    payloadHash: await sha256Hex(merchantParameters),
  };
}

export function encodeMerchantParameters(parameters: Record<string, unknown>) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(parameters)));
}

export function decodeMerchantParameters(encoded: string): Record<string, unknown> {
  try {
    const json = new TextDecoder("utf-8", { fatal: true }).decode(base64UrlToBytes(encoded));
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("Invalid Redsys merchant parameters");
  }
}

async function sha256Hex(value: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function readRedsysString(value: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (typeof value[key] === "string" || typeof value[key] === "number") return String(value[key]);
  }
  return "";
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
}

function bytesToBase64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  if (!/^[a-zA-Z0-9_-]+={0,2}$/.test(value)) throw new Error("Invalid base64url");
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let mismatch = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) mismatch |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  return mismatch === 0;
}
