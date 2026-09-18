export type PaymentMethod = "card" | "bizum" | "transfer" | "organizer";
export type PaymentStatus = "pending" | "processing" | "confirmed" | "failed" | "rejected" | "cancelled" | "refunded";

export type HostedPaymentForm = {
  provider: "redsys";
  action: string;
  method: "POST";
  fields: {
    Ds_SignatureVersion: "HMAC_SHA512_V2";
    Ds_MerchantParameters: string;
    Ds_Signature: string;
  };
};

export type PaymentProvider = {
  readonly name: string;
  createHostedPayment(input: {
    merchantOrder: string;
    amountCents: number;
    method: "card" | "bizum";
    notificationUrl: string;
    successUrl: string;
    cancelUrl: string;
    merchantData: string;
  }): Promise<HostedPaymentForm>;
};
