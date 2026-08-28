import { getSiteRuntimeEnv } from "@/lib/runtime-env";

/** Demo data is opt-in and must never be available on a production runtime. */
export function demoRoutesEnabled() {
  const env = getSiteRuntimeEnv();
  return env.ENABLE_DEMO_ROUTES === "true" || env.APP_ENV === "development" || env.APP_ENV === "test";
}
