import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet, Loader2, CheckCircle2, CreditCard, Bitcoin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { initNowPaymentsFunding } from "@/lib/nowpayments.functions";
import { initPaystackFunding, verifyPaystackFunding } from "@/lib/paystack.functions";
import { toast } from "sonner";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/wallet")({ component: WalletPage });

type Tx = { id: string; type: string; amount: number; balance_after: number; description: string | null; created_at: string };
type Method = "paystack" | "nowpayments";

const PAY_CURRENCIES = [
  { value: "usdttrc20", label: "USDT (TRC20)" },
  { value: "usdterc20", label: "USDT (ERC20)" },
  { value: "btc", label: "Bitcoin (BTC)" },
  { value: "eth", label: "Ethereum (ETH)" },
  { value: "bnbbsc", label: "BNB (BSC)" },
  { value: "ltc", label: "Litecoin (LTC)" },
];

function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("paystack");
  const [payCurrency, setPayCurrency] = useState("usdttrc20");
  const [coupon, setCoupon] = useState("");
  const [bonus, setBonus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Tx[]>([]);
  const initNP = useServerFn(initNowPaymentsFunding);
  const initPS = useServerFn(initPaystackFunding);
  const verifyPS = useServerFn(verifyPaystackFunding);

  async function load() {
    if (!user) return;
    const [bal, tx] = await Promise.all([
      supabase.from("profiles").select("balance").eq("id", user.id).maybeSingle(),
      supabase.from("wallet_transactions").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(50),
    ]);
    if (bal.data) setBalance(Number(bal.data.balance));
    setHistory((tx.data as Tx[]) ?? []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  // Handle return from payment checkout
  useEffect(() => {
    if (!user) return;
    const url = new URL(window.location.href);
    const npRef = url.searchParams.get("np_ref");
    const npCancel = url.searchParams.get("np_cancel");
    const psRef = url.searchParams.get("ps_ref") ?? url.searchParams.get("reference");
    if (!npRef && !npCancel && !psRef) return;

    (async () => {
      if (npRef) toast.success("Payment received — wallet will be credited once confirmed on-chain.");
      if (npCancel) toast.info("Payment cancelled");
      if (psRef) {
        try {
          const r = await verifyPS({ data: { reference: psRef } });
          if (r.credited) toast.success("Wallet funded successfully!");
          else toast.info(`Payment status: ${r.status}`);
        } catch (e: any) {
          toast.error(e?.message ?? "Could not verify payment");
        }
      }
      ["np_ref", "np_cancel", "ps_ref", "reference", "trxref"].forEach((k) => url.searchParams.delete(k));
      window.history.replaceState({}, "", url.toString());
      load();
    })();
    // eslint-disable-next-line
  }, [user]);

  async function checkCoupon() {
    const n = parseFloat(amount);
    if (!coupon.trim() || !n) { setBonus(null); return; }
    const { data, error } = await supabase.rpc("quote_coupon", {
      _code: coupon.trim(), _amount: n, _context: "funding",
    });
    if (error) { toast.error(error.message); setBonus(null); return; }
    setBonus(Number((data as any).discount));
    toast.success(`Bonus: +${formatNaira((data as any).discount)} on top`);
  }

  async function pay() {
    const n = parseFloat(amount);
    if (!n || n < 100) return toast.error("Minimum amount ₦100");
    setLoading(true);
    try {
      const payload = { amount: n, couponCode: coupon.trim() || undefined };
      const r = method === "paystack"
        ? await initPS({ data: payload })
        : await initNP({ data: { ...payload, payCurrency } });
      window.location.href = r.checkoutUrl;
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (/minimal|minimum/i.test(msg))
        toast.error("Selected cryptocurrency does not support this payment amount.");
      else toast.error(msg || "Payment init failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Wallet</h1>
        <p className="text-sm text-muted-foreground mt-1">Fund your wallet with cryptocurrency via NOWPayments.</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Available balance</p>
          <p className="text-4xl font-extrabold text-emerald-600 mt-1">{formatNaira(balance)}</p>
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-50">
          <Wallet className="h-6 w-6 text-emerald-600" />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Fund your wallet</h2>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Select payment method</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMethod("paystack")}
              className={`rounded-xl border-2 p-3 text-left transition-all ${method === "paystack" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted"}`}>
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#0BA4DB]/10">
                  <CreditCard className="h-4 w-4 text-[#0BA4DB]" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Paystack</div>
                  <div className="text-[10px] text-muted-foreground">Card · Bank · USSD</div>
                </div>
              </div>
            </button>
            <button type="button" onClick={() => setMethod("nowpayments")}
              className={`rounded-xl border-2 p-3 text-left transition-all ${method === "nowpayments" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted"}`}>
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100">
                  <Bitcoin className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold">NOWPayments</div>
                  <div className="text-[10px] text-muted-foreground">USDT · BTC · ETH</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
          <input type="number" min="100" value={amount} onChange={(e) => { setAmount(e.target.value); setBonus(null); }}
            placeholder="5000" className="w-full rounded-lg border bg-background pl-7 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {method === "nowpayments" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Pay with</label>
            <select value={payCurrency} onChange={(e) => setPayCurrency(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm">
              {PAY_CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <p className="mt-1 text-[10px] text-muted-foreground">Note: some coins have minimum amounts. If you see a minimum error, increase the amount or switch coin.</p>
          </div>
        )}

        <div className="flex gap-2">
          <input value={coupon} onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setBonus(null); }}
            placeholder="Coupon code (optional)" className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm font-mono uppercase" />
          <button type="button" onClick={checkCoupon} className="rounded-lg border px-4 text-sm hover:bg-muted">Apply</button>
        </div>
        {bonus != null && bonus > 0 && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> You pay {formatNaira(parseFloat(amount))}, wallet receives {formatNaira(parseFloat(amount) + bonus)}
          </div>
        )}

        <button onClick={pay} disabled={loading}
          className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Redirecting…" : method === "paystack" ? "Pay with Paystack" : "Pay with crypto"}
        </button>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="p-4 border-b font-semibold">Transaction history</div>
        {history.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No transactions yet.</p>
        ) : (
          <ul className="divide-y">
            {history.map((t) => (
              <li key={t.id} className="flex items-center justify-between p-4 gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium capitalize">{t.type.replace("_", " ")}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div className={`text-sm font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {t.amount >= 0 ? "+" : ""}{formatNaira(t.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
