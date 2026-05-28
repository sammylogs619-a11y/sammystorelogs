import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin-page";
import { Store, Loader2, Ban, RotateCcw, Search, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatNaira } from "@/lib/utils";

type Seller = {
  id: string; business_name: string; business_description: string | null;
  logo_url: string | null; balance: number; status: "pending" | "active" | "suspended" | "declined";
  created_at: string;
  paid_registration_at: string | null;
  registration_payment_ref: string | null;
};

const TABS: { key: "all" | Seller["status"]; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "active", label: "Approved" },
  { key: "suspended", label: "Suspended" },
  { key: "declined", label: "Declined" },
  { key: "all", label: "All" },
];

export const Route = createFileRoute("/admin/sellers")({ component: AdminSellers });

function AdminSellers() {
  const [items, setItems] = useState<Seller[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | Seller["status"]>("pending");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let query = supabase.from("sellers").select("*").order("created_at", { ascending: false }).limit(200);
    if (tab !== "all") query = query.eq("status", tab);
    if (q.trim()) query = query.ilike("business_name", `%${q}%`);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setItems((data as Seller[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  async function setStatus(s: Seller, status: Seller["status"]) {
    const { error } = await supabase.rpc("admin_set_seller_status", { _seller_id: s.id, _status: status });
    if (error) toast.error(error.message);
    else { toast.success(`Seller ${status}`); load(); }
  }

  return (
    <AdminPage title="Seller Requests" description="Review applications and manage your marketplace sellers.">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-xs rounded-full px-3 py-1.5 border transition ${tab === t.key ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by business name…"
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm" />
        </div>
        <button className="rounded-md bg-primary text-primary-foreground px-3 text-sm">Search</button>
      </form>

      {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        : items.length === 0 ? <EmptyState icon={Store} title="No sellers here" description="Nothing matches this filter yet." />
        : (
          <div className="grid gap-3">
            {items.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row gap-4">
                {s.logo_url
                  ? <img src={s.logo_url} alt="" className="h-20 w-20 rounded-lg border object-cover shrink-0" />
                  : <div className="h-20 w-20 rounded-lg border bg-muted grid place-items-center shrink-0"><Store className="h-7 w-7 text-muted-foreground" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{s.business_name}</h3>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${
                      s.status === "active" ? "bg-emerald-100 text-emerald-700"
                      : s.status === "suspended" ? "bg-rose-100 text-rose-700"
                      : s.status === "declined" ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                    }`}>{s.status}</span>
                    <span className="text-xs text-muted-foreground ml-auto">Balance: <strong>{formatNaira(s.balance)}</strong></span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.business_description || "No description provided."}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Applied {new Date(s.created_at).toLocaleString()}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.status === "pending" && (
                      <>
                        <button onClick={() => setStatus(s, "active")}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700">
                          <Check className="h-3.5 w-3.5" /> Accept
                        </button>
                        <button onClick={() => setStatus(s, "declined")}
                          className="inline-flex items-center gap-1 rounded-md bg-rose-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-rose-700">
                          <X className="h-3.5 w-3.5" /> Decline
                        </button>
                      </>
                    )}
                    {s.status === "active" && (
                      <button onClick={() => setStatus(s, "suspended")}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-300 text-rose-700 px-3 py-1.5 text-xs font-semibold hover:bg-rose-50">
                        <Ban className="h-3.5 w-3.5" /> Suspend
                      </button>
                    )}
                    {(s.status === "suspended" || s.status === "declined") && (
                      <button onClick={() => setStatus(s, "active")}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-300 text-emerald-700 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-50">
                        <RotateCcw className="h-3.5 w-3.5" /> Reactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </AdminPage>
  );
}
