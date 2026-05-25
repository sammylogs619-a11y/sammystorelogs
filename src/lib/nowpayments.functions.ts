import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const NP_BASE = "https://api.nowpayments.io/v1";

function need(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured. Add it under Cloud → Secrets.`);
  return v;
}

const InitInput = z.object({
  amount: z.number().min(100).max(10_000_000),
  payCurrency: z.string().trim().min(2).max(10).default("usdttrc20"),
  couponCode: z.string().trim().max(64).optional(),
});

/** Initiate a NOWPayments crypto invoice for wallet funding. */
export const initNowPaymentsFunding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => InitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const apiKey = need("NOWPAYMENTS_API_KEY");

    const { data: profile } = await supabase
      .from("profiles").select("email,username,is_suspended").eq("id", userId).single();
    if (!profile) throw new Error("Profile missing");
    if (profile.is_suspended) throw new Error("Account suspended");

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

    const reference = `SAMNP_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
    const origin = new URL(process.env.SUPABASE_URL ?? "https://example.com").origin;

    // NOWPayments expects amount in their `price_currency`. We pass NGN.
    const res = await fetch(`${NP_BASE}/invoice`, {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        price_amount: data.amount,
        price_currency: "ngn",
        pay_currency: data.payCurrency,
        order_id: reference,
        order_description: `Sammy Store wallet funding (${profile.username})`,
        ipn_callback_url: `${origin}/api/public/nowpayments-webhook`,
        success_url: `${origin}/dashboard/wallet?np_ref=${reference}`,
        cancel_url: `${origin}/dashboard/wallet?np_cancel=${reference}`,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json?.invoice_url) {
      throw new Error(`NOWPayments init failed: ${JSON.stringify(json).slice(0, 200)}`);
    }

    const { error } = await supabaseAdmin.from("payment_intents").insert({
      user_id: userId,
      provider: "nowpayments",
      provider_reference: reference,
      external_id: String(json.id ?? ""),
      amount_paid: data.amount,
      credit_amount: creditAmount,
      currency: "NGN",
      coupon_id: couponId,
      checkout_url: json.invoice_url,
      raw_payload: json,
    });
    if (error) throw new Error(error.message);

    return { checkoutUrl: json.invoice_url as string, reference };
  });
