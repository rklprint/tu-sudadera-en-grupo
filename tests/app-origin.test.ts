import assert from "node:assert/strict";
import test from "node:test";
import { getConfiguredAppOrigin, getRedsysReturnUrls, isAllowedAppRequestOrigin } from "../lib/app-origin";
import { getSiteRuntimeEnv, setSiteRuntimeEnv } from "../lib/runtime-env";

const originalRuntime = getSiteRuntimeEnv();

test.afterEach(() => {
  setSiteRuntimeEnv(originalRuntime);
});

test("Redsys URLs use only the configured canonical origin", () => {
  setSiteRuntimeEnv({ APP_ENV: "staging", APP_ORIGIN: "https://staging.tusudaderaengrupo.es" });
  const urls = getRedsysReturnUrls("TSG-PAYMENT-1", "cancel-token");

  assert.equal(urls.notificationUrl, "https://staging.tusudaderaengrupo.es/api/pagos/redsys/notificacion");
  assert.equal(urls.successUrl, "https://staging.tusudaderaengrupo.es/pago/resultado?ref=TSG-PAYMENT-1&estado=pendiente");
  assert.equal(urls.cancelUrl, "https://staging.tusudaderaengrupo.es/pago/resultado?ref=TSG-PAYMENT-1&estado=cancelado&token=cancel-token");
  assert.ok(Object.values(urls).every((value) => value.startsWith("https://staging.tusudaderaengrupo.es/")));
});

test("un Host/origen de petición no configurado no puede iniciar una operación", () => {
  setSiteRuntimeEnv({ APP_ENV: "staging", APP_ORIGIN: "https://staging.tusudaderaengrupo.es" });

  assert.equal(isAllowedAppRequestOrigin(new Request("https://staging.tusudaderaengrupo.es/api/pagos/iniciar")), true);
  assert.equal(isAllowedAppRequestOrigin(new Request("https://attacker.example/api/pagos/iniciar")), false);
});

test("staging rechaza un origen HTTP aunque lo entregue la configuración", () => {
  setSiteRuntimeEnv({ APP_ENV: "staging", APP_ORIGIN: "http://staging.tusudaderaengrupo.es" });
  assert.throws(() => getConfiguredAppOrigin({ requireHttps: true }), /HTTPS/);
});
