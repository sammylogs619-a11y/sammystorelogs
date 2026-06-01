import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Search, Loader2, KeyRound, X } from "lucide-react";

export type Product = { id: string; name: string; stock: number };
export type Login = {
  id: string;
  product_id: string;
  login_email: string | null;
  login_password: string | null;
  twofa_code: string | null;
  recovery_email: string | null;
  recovery_password: string | null;
  credential: string | null;
  password: string | null;
  notes: string | null;
  status: "available" | "sold" | "reserved" | string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  sold: "bg-muted text-muted-foreground",
  reserved: "bg-amber-100 text-amber-700",
};

/**
 * Reusable structured-log manager used by both Admin and Sellers.
 */
export function LogManager({ products }: { products: Product[] }) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [logins, setLogins] = useState<Login[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState<"single" | "bulk" | null>(null);
  const [editing, setEditing] = useState<Login | null>(null);

  useEffect(() => {
    if (!productId && products[0]) setProductId(products[0].id);
  }, [products, productId]);

  async function load() {
    if (!productId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("product_logins")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setLogins((data as Login[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [productId]);

  async function remove(id: string) {
    if (!confirm("Delete this log?")) return;
    const { error } = await supabase.from("product_logins").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("product_logins").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  const stats = useMemo(() => {
    const s = { total: logins.length, available: 0, sold: 0, reserved: 0 };
    logins.forEach((l) => {
      if (l.status === "available") s.available++;
      else if (l.status === "sold") s.sold++;
      else if (l.status === "reserved") s.reserved++;
    });
    return s;
  }, [logins]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logins.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${l.login_email ?? l.credential ?? ""} ${l.recovery_email ?? ""} ${l.notes ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [logins, search, statusFilter]);

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-12 text-center">
        <KeyRound className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Create a product first, then add logs.</p>
      </div>
    );
  }

  const current = products.find((p) => p.id === productId);

  return (
    <div className="space-y-4">
      {/* Product selector */}
      <div className="rounded-xl border bg-card p-4">
        <label className="block text-xs font-medium text-muted-foreground mb-2">Product</label>
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} — stock {p.stock}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Total" value={stats.total} />
        <Stat label="Available" value={stats.available} tone="emerald" />
        <Stat label="Sold" value={stats.sold} />
        <Stat label="Reserved" value={stats.reserved} tone="amber" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, recovery, notes…"
            className="w-full rounded-md border bg-background pl-8 pr-3 py-2 text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="all">All status</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="reserved">Reserved</option>
        </select>
        <button onClick={() => setShowForm("single")} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-muted">
          <Plus className="h-4 w-4" /> Add
        </button>
        <button onClick={() => setShowForm("bulk")} className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm">
          <Plus className="h-4 w-4" /> Bulk
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Login Email</th>
                <th className="text-left p-3">Password</th>
                <th className="text-left p-3">2FA</th>
                <th className="text-left p-3">Recovery</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No logs found.</td></tr>
              ) : filtered.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="p-3 font-mono text-xs truncate max-w-[160px]">{l.login_email || l.credential}</td>
                  <td className="p-3 font-mono text-xs truncate max-w-[120px]">{l.login_password || l.password}</td>
                  <td className="p-3 font-mono text-xs truncate max-w-[100px]">{l.twofa_code || "—"}</td>
                  <td className="p-3 font-mono text-xs truncate max-w-[160px]">{l.recovery_email || "—"}</td>
                  <td className="p-3">
                    <select
                      value={l.status}
                      onChange={(e) => setStatus(l.id, e.target.value)}
                      disabled={l.status === "sold"}
                      className={`rounded-md px-2 py-0.5 text-xs font-medium border-0 ${STATUS_COLORS[l.status] ?? "bg-muted"}`}
                    >
                      <option value="available">available</option>
                      <option value="reserved">reserved</option>
                      <option value="sold" disabled>sold</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(l)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                      {l.status !== "sold" && (
                        <button onClick={() => remove(l.id)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm === "single" && current && (
        <LogForm productId={current.id} onClose={() => setShowForm(null)} onSaved={() => { setShowForm(null); load(); }} />
      )}
      {showForm === "bulk" && current && (
        <BulkForm productId={current.id} onClose={() => setShowForm(null)} onSaved={() => { setShowForm(null); load(); }} />
      )}
      {editing && (
        <LogForm productId={editing.product_id} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "amber" }) {
  const color = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "";
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}

function LogForm({ productId, initial, onClose, onSaved }: { productId: string; initial?: Login; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    login_email: initial?.login_email ?? initial?.credential ?? "",
    login_password: initial?.login_password ?? initial?.password ?? "",
    twofa_code: initial?.twofa_code ?? "",
    recovery_email: initial?.recovery_email ?? "",
    recovery_password: initial?.recovery_password ?? "",
    notes: initial?.notes ?? "",
    status: initial?.status ?? "available",
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.login_email.trim() || !f.login_password.trim()) return toast.error("Login email & password required");
    setSaving(true);
    const payload = {
      product_id: productId,
      login_email: f.login_email.trim(),
      login_password: f.login_password.trim(),
      credential: f.login_email.trim(),
      password: f.login_password.trim(),
      twofa_code: f.twofa_code.trim() || null,
      recovery_email: f.recovery_email.trim() || null,
      recovery_password: f.recovery_password.trim() || null,
      notes: f.notes.trim() || null,
      status: f.status,
    };
    const res = initial
      ? await supabase.from("product_logins").update(payload).eq("id", initial.id)
      : await supabase.from("product_logins").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(initial ? "Updated" : "Added");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "Edit log" : "Add log"}</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <Field label="Login Email" value={f.login_email} onChange={(v) => setF({ ...f, login_email: v })} required />
        <Field label="Login Password" value={f.login_password} onChange={(v) => setF({ ...f, login_password: v })} required />
        <Field label="2FA Code / Backup Codes" value={f.twofa_code} onChange={(v) => setF({ ...f, twofa_code: v })} />
        <Field label="Recovery Email" value={f.recovery_email} onChange={(v) => setF({ ...f, recovery_email: v })} />
        <Field label="Recovery Email Password" value={f.recovery_password} onChange={(v) => setF({ ...f, recovery_password: v })} />
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
          <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
          <button disabled={saving} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && <span className="text-destructive"> *</span>}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono" />
    </div>
  );
}

function BulkForm({ productId, onClose, onSaved }: { productId: string; onClose: () => void; onSaved: () => void }) {
  const [bulk, setBulk] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const rows = bulk
      .split("\n").map((l) => l.trim()).filter(Boolean)
      .map((line) => {
        const p = line.split("|").map((x) => x.trim());
        if (p.length < 2) return null;
        return {
          product_id: productId,
          login_email: p[0],
          login_password: p[1],
          credential: p[0],
          password: p[1],
          twofa_code: p[2] || null,
          recovery_email: p[3] || null,
          recovery_password: p[4] || null,
          status: "available",
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null && !!r.login_email && !!r.login_password);
    if (rows.length === 0) return toast.error("No valid rows");
    setSaving(true);
    const { error } = await supabase.from("product_logins").insert(rows);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Imported ${rows.length} logs`);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-xl rounded-xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Bulk import</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          One log per line. Pipe-separated fields:
          <code className="ml-1 rounded bg-muted px-1 py-0.5">email | password | 2fa | recovery_email | recovery_password</code>
          <br />Last three fields are optional.
        </p>
        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          rows={12}
          placeholder={"user1@mail.com | Pass123 | 123456 | recovery@mail.com | RecPass1\nuser2@mail.com | Pass456"}
          className="mt-3 w-full rounded-md border bg-background p-3 text-xs font-mono"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
          <button disabled={saving} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50">{saving ? "Importing…" : "Import"}</button>
        </div>
      </form>
    </div>
  );
}
