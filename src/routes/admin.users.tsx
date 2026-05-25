import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin-page";
import { Users, Search, Loader2, Ban, RotateCcw, Plus, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Profile = {
  id: string; username: string; email: string | null;
  balance: number; is_suspended: boolean; suspended_reason: string | null; created_at: string;
};

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

function UsersPage() {
  const [items, setItems] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjust, setAdjust] = useState<Profile | null>(null);

  async function load() {
    setLoading(true);
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
    if (q.trim()) query = query.or(`email.ilike.%${q}%,username.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setItems((data as Profile[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function toggleSuspend(u: Profile) {
    const reason = !u.is_suspended ? prompt("Reason for suspension?") ?? "Suspended by admin" : "";
    const { error } = await supabase.rpc("set_user_suspended", {
      _user_id: u.id, _suspended: !u.is_suspended, _reason: reason,
    });
    if (error) toast.error(error.message);
    else { toast.success(u.is_suspended ? "User restored" : "User suspended"); load(); }
  }

  return (
    <AdminPage title="Users" description="Search and manage registered users.">
      <form onSubmit={(e) => { e.preventDefault(); load(); }}
        className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email or username…"
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm" />
        </div>
        <button className="rounded-md bg-primary text-primary-foreground px-3 text-sm">Search</button>
      </form>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search." />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">User</th>
                  <th className="text-right p-3">Balance</th>
                  <th className="text-left p-3 hidden md:table-cell">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{u.username}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="p-3 text-right font-semibold">₦{Number(u.balance).toLocaleString()}</td>
                    <td className="p-3 hidden md:table-cell">
                      {u.is_suspended
                        ? <span className="text-xs rounded-md bg-rose-100 text-rose-700 px-2 py-0.5">Suspended</span>
                        : <span className="text-xs rounded-md bg-emerald-100 text-emerald-700 px-2 py-0.5">Active</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setAdjust(u)} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">Adjust ₦</button>
                        <button onClick={() => toggleSuspend(u)}
                          className={`grid h-8 w-8 place-items-center rounded-md ${u.is_suspended ? "hover:bg-emerald-100 text-emerald-700" : "hover:bg-rose-100 text-rose-700"}`}>
                          {u.is_suspended ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
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

      {adjust && <AdjustModal user={adjust} onClose={() => setAdjust(null)} onSaved={() => { setAdjust(null); load(); }} />}
    </AdminPage>
  );
}

function AdjustModal({ user, onClose, onSaved }: { user: Profile; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [sign, setSign] = useState<"+" | "-">("+");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) return toast.error("Enter a positive amount");
    setSaving(true);
    const { error } = await supabase.rpc("admin_adjust_wallet", {
      _user_id: user.id, _amount: sign === "+" ? n : -n, _description: desc || "Manual adjustment",
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Wallet updated"); onSaved(); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl space-y-3">
        <h2 className="text-lg font-bold">Adjust wallet</h2>
        <p className="text-sm text-muted-foreground">{user.username} — current ₦{Number(user.balance).toLocaleString()}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setSign("+")} className={`flex-1 rounded-md border py-2 text-sm inline-flex items-center justify-center gap-1 ${sign === "+" ? "bg-emerald-100 text-emerald-700 border-emerald-300" : ""}`}>
            <Plus className="h-4 w-4" /> Credit
          </button>
          <button type="button" onClick={() => setSign("-")} className={`flex-1 rounded-md border py-2 text-sm inline-flex items-center justify-center gap-1 ${sign === "-" ? "bg-rose-100 text-rose-700 border-rose-300" : ""}`}>
            <Minus className="h-4 w-4" /> Debit
          </button>
        </div>
        <input type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (₦)" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Note (optional)"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
          <button disabled={saving} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : "Apply"}
          </button>
        </div>
      </form>
    </div>
  );
}
