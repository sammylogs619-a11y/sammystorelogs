import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) return new Response("not configured", { status: 500 });

        const sigHeader = request.headers.get("x-paystack-signature") ?? "";
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

        if (payload?.event !== "charge.success") return new Response("ignored");
        const reference: string | undefined = payload?.data?.reference;
        if (!reference) return new Response("missing reference", { status: 400 });

        const { error } = await (supabaseAdmin.rpc as any)("credit_wallet_from_payment", {
          _provider: "paystack",
          _provider_reference: reference,
          _external_id: String(payload?.data?.id ?? ""),
          _raw: payload?.data ?? payload,
        });
        if (error && !/already/i.test(error.message)) {
          console.error("Paystack webhook credit error:", error);
          return new Response(error.message, { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
