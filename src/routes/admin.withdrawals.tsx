import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin-page";
import { Banknote, Loader2, Check, X, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatNaira } from "@/lib/utils";

type W = {
  id: string; seller_id: string; bank_name: string; account_number: string; account_name: string;
  amount: number; status: "pending" | "approved" | "rejected" | "paid"; admin_note: string | null;
  created_at: string;
  seller?: { business_name: string } | null;
};

export const Route = createFileRoute("/admin/withdrawals")({ component: Page });

function Page() {
  const [items, setItems] = useState<W[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "paid">("pending");

  async function load() {
    setLoading(true);
    let q = supabase.from("withdrawal_requests")
      .select("*, seller:sellers(business_name)")
      .order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems((data as W[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function setStatus(id: string, status: "approved" | "rejected" | "paid") {
    const note = status === "rejected" ? prompt("Reason for rejection?") ?? "" : "";
    const { error } = await supabase.rpc("admin_set_withdrawal_status", { _id: id, _status: status, _note: note });
    if (error) toast.error(error.message);
    else { toast.success(`Marked ${status}`); load(); }
  }

  return (
    <AdminPage title="Withdrawals" description="Seller payout requests. Pay to the bank details below, then mark as paid.">
      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "paid", "rejected", "all"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${filter === s ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}>{s}</button>
        ))}
      </div>
      {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        : items.length === 0 ? <EmptyState icon={Banknote} title="No withdrawal requests" description="Seller withdrawal requests will appear here." />
        : (
          <div className="space-y-3">
            {items.map((w) => (
              <div key={w.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{w.seller?.business_name ?? w.seller_id}</div>
                    <div className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-xl font-bold text-emerald-600">{formatNaira(w.amount)}</div>
                </div>
                <div className="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
                  <div><div className="text-[10px] uppercase text-muted-foreground">Bank</div>{w.bank_name}</div>
                  <div><div className="text-[10px] uppercase text-muted-foreground">Account #</div><span className="font-mono">{w.account_number}</span></div>
                  <div><div className="text-[10px] uppercase text-muted-foreground">Account name</div>{w.account_name}</div>
                </div>
                {w.admin_note && <p className="mt-2 text-xs text-muted-foreground">Note: {w.admin_note}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <span className={`text-xs rounded-md px-2 py-0.5 capitalize ${
                    w.status === "paid" ? "bg-emerald-100 text-emerald-700"
                    : w.status === "approved" ? "bg-blue-100 text-blue-700"
                    : w.status === "rejected" ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
                  }`}>{w.status}</span>
                  {w.status === "pending" && (
                    <>
                      <button onClick={() => setStatus(w.id, "approved")} className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs hover:bg-muted"><Check className="h-3 w-3" /> Approve</button>
                      <button onClick={() => setStatus(w.id, "rejected")} className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs hover:bg-rose-50 text-rose-700"><X className="h-3 w-3" /> Reject</button>
                    </>
                  )}
                  {(w.status === "pending" || w.status === "approved") && (
                    <button onClick={() => setStatus(w.id, "paid")} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 text-white px-3 py-1 text-xs"><Truck className="h-3 w-3" /> Mark paid</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </AdminPage>
  );
}
