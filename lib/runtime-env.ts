import type { AnyD1Database } from "drizzle-orm/d1";

export type D1Binding = AnyD1Database;

export type R2ObjectBinding = {
  body: ReadableStream<Uint8Array>;
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
};

export type R2BucketBinding = {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream<Uint8Array> | string,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBinding | null>;
  delete(key: string): Promise<void>;
};

export type SiteRuntimeEnv = {
  DB?: D1Binding;
  BUCKET?: R2BucketBinding;
  RESEND_API_KEY?: string;
  QUOTE_TO_EMAIL?: string;
  QUOTE_FROM_EMAIL?: string;
  ADMIN_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
  TRUST_OPENAI_IDENTITY_HEADERS?: string;
  REDSYS_ENVIRONMENT?: string;
  REDSYS_MERCHANT_CODE?: string;
  REDSYS_TERMINAL?: string;
  REDSYS_SIGNING_KEY?: string;
  REDSYS_BIZUM_ENABLED?: string;
  BANK_TRANSFER_IBAN?: string;
  BANK_TRANSFER_ACCOUNT_HOLDER?: string;
  APP_ENV?: string;
};

type RuntimeGlobal = typeof globalThis & {
  __TSG_SITE_RUNTIME_ENV__?: SiteRuntimeEnv;
};

export function setSiteRuntimeEnv(runtimeEnv: SiteRuntimeEnv) {
  (globalThis as RuntimeGlobal).__TSG_SITE_RUNTIME_ENV__ = runtimeEnv;
}

export function getSiteRuntimeEnv() {
  return (globalThis as RuntimeGlobal).__TSG_SITE_RUNTIME_ENV__ || {};
}
