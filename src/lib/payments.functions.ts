import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MONNIFY_BASE = "https://api.monnify.com";

function need(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured. Add it under Cloud → Secrets.`);
  return v;
}

async function monnifyToken() {
  const apiKey = need("MONNIFY_API_KEY");
  const secret = need("MONNIFY_SECRET_KEY");
  const basic = Buffer.from(`${apiKey}:${secret}`).toString("base64");
  const res = await fetch(`${MONNIFY_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
  });
  const json = await res.json();
  if (!res.ok || !json?.responseBody?.accessToken)
    throw new Error(`Monnify auth failed: ${JSON.stringify(json)}`);
  return json.responseBody.accessToken as string;
}

const InitFundingInput = z.object({
  amount: z.number().min(100).max(10_000_000),
  couponCode: z.string().trim().max(64).optional(),
});

export const initFunding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => InitFundingInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { amount } = data;

    const { data: profile } = await supabase
      .from("profiles").select("email,username,is_suspended").eq("id", userId).single();
    if (!profile) throw new Error("Profile missing");
    if (profile.is_suspended) throw new Error("Account suspended");

    let creditAmount = amount;
    let couponId: string | null = null;
    if (data.couponCode) {
      const { data: q, error } = await supabase.rpc("quote_coupon", {
        _code: data.couponCode, _amount: amount, _context: "funding",
      });
      if (error) throw new Error(error.message);
      const quote = q as { coupon_id: string; discount: number };
      couponId = quote.coupon_id;
      creditAmount = amount + Number(quote.discount);
    }

    const reference = `SAM_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
    const origin = new URL(process.env.SUPABASE_URL ?? "https://example.com").origin;

    const token = await monnifyToken();
    const contractCode = need("MONNIFY_CONTRACT_CODE");
    const res = await fetch(`${MONNIFY_BASE}/api/v1/merchant/transactions/init-transaction`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        customerName: profile.username,
        customerEmail: profile.email ?? `${userId}@sammystore.local`,
        paymentReference: reference,
        paymentDescription: "Wallet funding",
        currencyCode: "NGN",
        contractCode,
        redirectUrl: `${origin}/dashboard/wallet?ref=${reference}`,
        paymentMethods: ["CARD", "ACCOUNT_TRANSFER", "USSD"],
      }),
    });
    const json = await res.json();
    const checkoutUrl: string | undefined = json?.responseBody?.checkoutUrl;
    const txRef: string | undefined = json?.responseBody?.transactionReference;
    if (!res.ok || !checkoutUrl) throw new Error(`Monnify init failed: ${JSON.stringify(json)}`);

    const { error } = await supabaseAdmin.from("payment_intents").insert({
      user_id: userId, provider: "monnify", provider_reference: reference, external_id: txRef ?? null,
      amount_paid: amount, credit_amount: creditAmount, currency: "NGN",
      coupon_id: couponId, checkout_url: checkoutUrl, raw_payload: json,
    });
    if (error) throw new Error(error.message);
    return { checkoutUrl, reference };
  });

const VerifyInput = z.object({ reference: z.string().min(4).max(80) });

export const verifyMonnifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => VerifyInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: intent } = await supabaseAdmin
      .from("payment_intents").select("*").eq("provider_reference", data.reference).single();
    if (!intent || intent.user_id !== userId) throw new Error("Not found");
    if (intent.status === "paid") return { status: "paid" };

    const token = await monnifyToken();
    const res = await fetch(
      `${MONNIFY_BASE}/api/v2/merchant/transactions/query?paymentReference=${encodeURIComponent(data.reference)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const json = await res.json();
    const status = json?.responseBody?.paymentStatus;
    if (status === "PAID") {
      const { error } = await supabaseAdmin.rpc("credit_wallet_from_payment", {
        _provider: "monnify",
        _provider_reference: data.reference,
        _external_id: json?.responseBody?.transactionReference ?? null,
        _raw: json,
      });
      if (error) throw new Error(error.message);
      return { status: "paid" };
    }
    return { status: status?.toLowerCase() ?? "pending" };
  });
