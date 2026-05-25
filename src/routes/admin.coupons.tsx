import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin-page";
import { Ticket, Plus, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Coupon = {
  id: string; code: string; kind: "percent" | "fixed"; value: number;
  scope: "funding" | "purchase" | "both";
  max_uses: number | null; per_user_limit: number; min_amount: number;
  uses_count: number; expires_at: string | null; is_active: boolean; created_at: string;
};

export const Route = createFileRoute("/admin/coupons")({ component: CouponsPage });

function CouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Coupon[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggle(c: Coupon) {
    const { error } = await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) toast.error(error.message); else load();
  }
  async function del(id: string) {
    if (!confirm("Delete coupon?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  }

  return (
    <AdminPage
      title="Giveaway Coupons"
      description="Create coupons that grant credit or discounts."
      actions={
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> New coupon
        </button>
      }
    >
      {showForm && <CouponForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Ticket} title="No coupons created"
          description="Create promo coupons to give away credit or discounts." />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3">Discount</th>
                  <th className="text-left p-3 hidden md:table-cell">Scope</th>
                  <th className="text-right p-3">Uses</th>
                  <th className="text-left p-3 hidden md:table-cell">Expires</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3 font-mono font-semibold">{c.code}</td>
                    <td className="p-3">{c.kind === "percent" ? `${c.value}%` : `₦${Number(c.value).toLocaleString()}`}</td>
                    <td className="p-3 hidden md:table-cell capitalize">{c.scope}</td>
                    <td className="p-3 text-right">{c.uses_count}{c.max_uses != null ? `/${c.max_uses}` : ""}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => toggle(c)} className={`rounded-md px-2 py-1 text-xs ${c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                          {c.is_active ? "Active" : "Paused"}
                        </button>
                        <button onClick={() => del(c.id)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-destructive/10 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminPage>
  );
}

function CouponForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [scope, setScope] = useState<"funding" | "purchase" | "both">("both");
  const [maxUses, setMaxUses] = useState("");
  const [perUser, setPerUser] = useState("1");
  const [minAmount, setMinAmount] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !value) return toast.error("Code and value are required");
    setSaving(true);
    const { error } = await supabase.from("coupons").insert({
      code: code.trim().toUpperCase(),
      kind, value: parseFloat(value), scope,
      max_uses: maxUses ? parseInt(maxUses) : null,
      per_user_limit: parseInt(perUser) || 1,
      min_amount: parseFloat(minAmount) || 0,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Coupon created"); onSaved(); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-3">
        <h2 className="text-lg font-bold">New coupon</h2>
        <L label="Code"><input required value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono uppercase" placeholder="WELCOME10" /></L>
        <div className="grid grid-cols-2 gap-3">
          <L label="Type">
            <select value={kind} onChange={(e) => setKind(e.target.value as any)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed (₦)</option>
            </select>
          </L>
          <L label="Value"><input type="number" min="0" step="0.01" required value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" /></L>
        </div>
        <L label="Works on">
          <select value={scope} onChange={(e) => setScope(e.target.value as any)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="both">Funding & Purchases</option>
            <option value="funding">Wallet Funding only</option>
            <option value="purchase">Product Purchases only</option>
          </select>
        </L>
        <div className="grid grid-cols-2 gap-3">
          <L label="Max uses (blank = unlimited)"><input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" /></L>
          <L label="Per-user limit"><input type="number" min="1" value={perUser} onChange={(e) => setPerUser(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" /></L>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <L label="Min amount (₦)"><input type="number" min="0" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" /></L>
          <L label="Expires at"><input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" /></L>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : "Create coupon"}
          </button>
        </div>
      </form>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}
