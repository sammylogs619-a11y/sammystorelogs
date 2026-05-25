import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Banknote, Loader2 } from "lucide-react";
import { formatNaira } from "@/lib/utils";

type W = {
  id: string; bank_name: string; account_number: string; account_name: string;
  amount: number; status: "pending" | "approved" | "rejected" | "paid"; admin_note: string | null; created_at: string;
};

export const Route = createFileRoute("/seller/withdrawals")({ component: Page });

function Page() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [items, setItems] = useState<W[]>([]);
  const [loading, setLoading] = useState(true);

  const [bank, setBank] = useState("");
  const [acctNo, setAcctNo] = useState("");
  const [acctName, setAcctName] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!user) return;
    const [s, w] = await Promise.all([
      supabase.from("sellers").select("balance").eq("id", user.id).maybeSingle(),
      supabase.from("withdrawal_requests").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
    ]);
    setBalance(Number(s.data?.balance ?? 0));
    setItems((w.data as W[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) return toast.error("Enter an amount");
    if (n > balance) return toast.error("Amount exceeds your balance");
    if (!bank.trim() || !acctNo.trim() || !acctName.trim()) return toast.error("Fill all bank fields");
    setSaving(true);
    const { error } = await supabase.rpc("request_withdrawal", {
      _bank_name: bank.trim(), _account_number: acctNo.trim(), _account_name: acctName.trim(), _amount: n,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Withdrawal request sent to admin");
      setBank(""); setAcctNo(""); setAcctName(""); setAmount("");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Withdrawals</h1>
        <p className="text-sm text-muted-foreground mt-1">Withdraw your earnings to your bank account.</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Available balance</p>
          <p className="text-4xl font-extrabold text-emerald-600 mt-1">{formatNaira(balance)}</p>
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-50">
          <Banknote className="h-6 w-6 text-emerald-600" />
        </div>
      </div>

      <form onSubmit={submit} className="rounded-2xl border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Request a withdrawal</h2>
        <input required value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank name" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <input required value={acctNo} onChange={(e) => setAcctNo(e.target.value)} placeholder="Account number" className="rounded-md border bg-background px-3 py-2 text-sm" />
          <input required value={acctName} onChange={(e) => setAcctName(e.target.value)} placeholder="Account name" className="rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
          <input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount" className="w-full rounded-md border bg-background pl-7 pr-3 py-2 text-sm" />
        </div>
        <button disabled={saving} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 font-semibold disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Submit request
        </button>
      </form>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="p-4 border-b font-semibold">History</div>
        {loading ? <div className="p-6 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          : items.length === 0 ? <p className="p-6 text-sm text-muted-foreground text-center">No withdrawal requests yet.</p>
          : (
            <ul className="divide-y">
              {items.map((w) => (
                <li key={w.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{formatNaira(w.amount)}</div>
                    <div className="text-xs text-muted-foreground">{w.bank_name} · {w.account_number} · {w.account_name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(w.created_at).toLocaleString()}</div>
                    {w.admin_note && <div className="text-xs text-muted-foreground mt-1">Note: {w.admin_note}</div>}
                  </div>
                  <span className={`text-xs rounded-md px-2 py-0.5 capitalize ${
                    w.status === "paid" ? "bg-emerald-100 text-emerald-700"
                    : w.status === "approved" ? "bg-blue-100 text-blue-700"
                    : w.status === "rejected" ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
                  }`}>{w.status}</span>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
