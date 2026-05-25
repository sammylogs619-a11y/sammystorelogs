import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Sort object keys recursively (matches NOWPayments IPN signing spec). */
function sortObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj && typeof obj === "object") {
    return Object.keys(obj).sort().reduce((acc: Record<string, any>, k) => {
      acc[k] = sortObject(obj[k]);
      return acc;
    }, {});
  }
  return obj;
}

export const Route = createFileRoute("/api/public/nowpayments-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.NOWPAYMENTS_IPN_SECRET;
        if (!secret) return new Response("not configured", { status: 500 });

        const sigHeader = request.headers.get("x-nowpayments-sig") ?? "";
        const body = await request.text();
        let payload: any;
        try { payload = JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }

        // NOWPayments signs HMAC-SHA512 of sorted-by-key JSON string
        const sortedJson = JSON.stringify(sortObject(payload));
        const expected = createHmac("sha512", secret).update(sortedJson).digest("hex");
        try {
          const a = Buffer.from(sigHeader, "hex");
          const b = Buffer.from(expected, "hex");
          if (a.length !== b.length || !timingSafeEqual(a, b))
            return new Response("invalid signature", { status: 401 });
        } catch {
          return new Response("invalid signature", { status: 401 });
        }

        const status = String(payload?.payment_status ?? "");
        const reference = payload?.order_id;
        if (!reference) return new Response("missing order_id", { status: 400 });

        // Only credit on confirmed/finished states
        if (status === "finished" || status === "confirmed") {
          const { error } = await supabaseAdmin.rpc("credit_wallet_from_payment", {
            _provider: "nowpayments",
            _provider_reference: reference,
            _external_id: String(payload?.payment_id ?? ""),
            _raw: payload,
          });
          if (error) {
            console.error("NOWPayments credit error:", error);
            return new Response(error.message, { status: 500 });
          }
        }
        return new Response("ok");
      },
    },
  },
});
