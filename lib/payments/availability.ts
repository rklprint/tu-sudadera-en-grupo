import { getRedsysConfig } from "@/lib/payments/redsys";
import { getSiteRuntimeEnv } from "@/lib/runtime-env";

export function paymentAvailability() {
  const environment = getSiteRuntimeEnv();
  const redsys = Boolean(getRedsysConfig());
  return {
    card: redsys,
    bizum: redsys && environment.REDSYS_BIZUM_ENABLED === "true",
    transfer: Boolean(environment.BANK_TRANSFER_IBAN && environment.BANK_TRANSFER_ACCOUNT_HOLDER),
  };
}
