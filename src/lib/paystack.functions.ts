import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PS_BASE = "https://api.paystack.co";

function need(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured. Add it under Cloud → Secrets.`);
  return v;
}

const InitInput = z.object({
  amount: z.number().min(100).max(10_000_000),
  couponCode: z.string().trim().max(64).optional(),
});

/** Initiate a Paystack transaction for wallet funding (NGN). */
export const initPaystackFunding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => InitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const apiKey = need("PAYSTACK_SECRET_KEY");

    const { data: profile } = await supabase
      .from("profiles").select("email,username,is_suspended").eq("id", userId).single();
    if (!profile) throw new Error("Profile missing");
    if (profile.is_suspended) throw new Error("Account suspended");
    if (!profile.email) throw new Error("Email missing on profile");

    let creditAmount = data.amount;
    let couponId: string | null = null;
    if (data.couponCode) {
      const { data: q, error } = await supabase.rpc("quote_coupon", {
        _code: data.couponCode, _amount: data.amount, _context: "funding",
      });
      if (error) throw new Error(error.message);
      const quote = q as { coupon_id: string; discount: number };
      couponId = quote.coupon_id;
      creditAmount = data.amount + Number(quote.discount);
    }

    const reference = `SAMPS_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
    const origin = new URL(process.env.SUPABASE_URL ?? "https://example.com").origin;

    const res = await fetch(`${PS_BASE}/transaction/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: profile.email,
        amount: Math.round(data.amount * 100), // Paystack uses kobo
        currency: "NGN",
        reference,
        callback_url: `${origin}/dashboard/wallet?ps_ref=${reference}`,
        metadata: { user_id: userId, username: profile.username, purpose: "wallet_funding" },
      }),
    });
    const json = await res.json();
    if (!res.ok || !json?.status || !json?.data?.authorization_url) {
      throw new Error(`Paystack init failed: ${json?.message ?? "unknown error"}`);
    }

    const { error } = await supabaseAdmin.from("payment_intents").insert({
      user_id: userId,
      provider: "paystack",
      provider_reference: reference,
      external_id: String(json.data.reference ?? reference),
      amount_paid: data.amount,
      credit_amount: creditAmount,
      currency: "NGN",
      coupon_id: couponId,
      checkout_url: json.data.authorization_url,
      raw_payload: json,
    });
    if (error) throw new Error(error.message);

    return { checkoutUrl: json.data.authorization_url as string, reference };
  });

/** Verify a Paystack transaction after redirect (idempotent — also covered by webhook). */
export const verifyPaystackFunding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ reference: z.string().min(4).max(128) }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = need("PAYSTACK_SECRET_KEY");
    const res = await fetch(`${PS_BASE}/transaction/verify/${encodeURIComponent(data.reference)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const json = await res.json();
    if (!res.ok || !json?.status) throw new Error(json?.message ?? "Verification failed");
    const status = json.data?.status;
    if (status !== "success") return { credited: false, status };

    const { error } = await (supabaseAdmin.rpc as any)("credit_wallet_from_payment", {
      _provider: "paystack",
      _provider_reference: data.reference,
      _external_id: String(json.data?.id ?? ""),
      _raw: json.data,
    });
    if (error && !/already/i.test(error.message)) throw new Error(error.message);
    return { credited: true, status };
  });
