import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/monnify-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.MONNIFY_SECRET_KEY;
        if (!secret) return new Response("not configured", { status: 500 });

        const sigHeader = request.headers.get("monnify-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha512", secret).update(body).digest("hex");
        try {
          const a = Buffer.from(sigHeader, "hex");
          const b = Buffer.from(expected, "hex");
          if (a.length !== b.length || !timingSafeEqual(a, b))
            return new Response("invalid signature", { status: 401 });
        } catch {
          return new Response("invalid signature", { status: 401 });
        }

        let payload: any;
        try { payload = JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }

        const ev = payload?.eventType;
        const data = payload?.eventData ?? {};
        if (ev === "SUCCESSFUL_TRANSACTION" && data?.paymentStatus === "PAID") {
          const ref = data.paymentReference;
          const txRef = data.transactionReference ?? null;
          const { error } = await supabaseAdmin.rpc("credit_wallet_from_payment", {
            _provider: "monnify",
            _provider_reference: ref,
            _external_id: txRef,
            _raw: payload,
          });
          if (error) {
            console.error("Monnify credit error:", error);
            return new Response(error.message, { status: 500 });
          }
        }
        return new Response("ok");
      },
    },
  },
});
