export type PaymentProvider = {
  code: string;
  request: (input: { amountRial: number; callbackUrl: string; description: string }) => Promise<{ authority: string; url: string }>;
  verify: (authority: string, amountRial: number) => Promise<{ verified: boolean; reference?: string; code: string }>;
};

// Credentials remain on the server. No sandbox provider can activate production subscriptions.
export function paymentProvider(settings: Record<string, unknown>, send: typeof fetch = fetch): PaymentProvider | null {
  const merchant = String(settings.ZARINPAL_MERCHANT_ID || "");
  if (settings.PAYMENTS_ENABLED !== "true" || settings.PAYMENT_PROVIDER !== "zarinpal" || !/^[a-f\d-]{36}$/i.test(merchant)) return null;
  async function call(action: string, data: Record<string, unknown>) {
    const response = await send(`https://api.zarinpal.com/pg/v4/payment/${action}.json`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant_id: merchant, ...data }), signal: AbortSignal.timeout(8000), redirect: "error",
    });
    if (!response.ok) throw new Error("PAYMENT_NETWORK_ERROR");
    const result = await response.json() as any;
    if (!result || typeof result !== "object") throw new Error("PAYMENT_NETWORK_ERROR");
    return result;
  }
  return {
    code: "zarinpal",
    async request(input) {
      const result = await call("request", { amount: input.amountRial, currency: "IRR", callback_url: input.callbackUrl, description: input.description });
      const authority = String(result.data?.authority || "");
      if (result.data?.code !== 100 || !/^A[a-zA-Z0-9]{35}$/.test(authority)) throw new Error("PAYMENT_REQUEST_REJECTED");
      return { authority, url: `https://www.zarinpal.com/pg/StartPay/${authority}` };
    },
    async verify(authority, amountRial) {
      const result = await call("verify", { authority, amount: amountRial });
      const code = Number(result.data?.code ?? result.errors?.code);
      const reference = String(result.data?.ref_id || "");
      if ([100, 101].includes(code) && /^[0-9]{1,30}$/.test(reference)) return { verified: true, reference, code: String(code) };
      return { verified: false, code: String(code) };
    },
  };
}
