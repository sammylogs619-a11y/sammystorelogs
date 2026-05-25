import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, KeyRound } from "lucide-react";

type Product = { id: string; name: string; stock: number };
type Login = { id: string; credential: string; password: string; status: string };

export const Route = createFileRoute("/seller/product-logins")({ component: Page });

function Page() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [pid, setPid] = useState("");
  const [logins, setLogins] = useState<Login[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadProducts() {
    if (!user) return;
    const { data } = await supabase.from("products").select("id,name,stock").eq("seller_id", user.id).order("name");
    setProducts((data as Product[]) ?? []);
    if (data?.length && !pid) setPid(data[0].id);
    setLoading(false);
  }
  async function loadLogins() {
    if (!pid) { setLogins([]); return; }
    const { data, error } = await supabase.from("product_logins").select("*").eq("product_id", pid).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setLogins((data as Login[]) ?? []);
  }
  useEffect(() => { loadProducts(); /* eslint-disable-next-line */ }, [user]);
  useEffect(() => { loadLogins(); }, [pid]);

  async function del(id: string) {
    if (!confirm("Delete this login?")) return;
    const { error } = await supabase.from("product_logins").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); loadLogins(); loadProducts(); }
  }
  const current = products.find((p) => p.id === pid);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Product Logins</h1>
        {products.length > 0 && (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm">
            <Plus className="h-4 w-4" /> Upload logins
          </button>
        )}
      </div>

      {showForm && current && (
        <Upload product={current} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadLogins(); loadProducts(); }} />
      )}

      {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        : products.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <KeyRound className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Add a product first, then upload its logins.</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-card p-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Product</label>
              <select value={pid} onChange={(e) => setPid(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} — stock {p.stock}</option>)}
              </select>
            </div>
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr><th className="text-left p-3">Credential</th><th className="text-left p-3">Password</th><th className="text-left p-3">Status</th><th className="text-right p-3">Actions</th></tr>
                </thead>
                <tbody>
                  {logins.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">No logins uploaded.</td></tr>
                  ) : logins.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="p-3 font-mono text-xs">{l.credential}</td>
                      <td className="p-3 font-mono text-xs">{l.password}</td>
                      <td className="p-3"><span className={`rounded-md px-2 py-0.5 text-xs ${l.status === "available" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{l.status}</span></td>
                      <td className="p-3 text-right">
                        {l.status === "available" && <button onClick={() => del(l.id)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-destructive/10 text-destructive ml-auto"><Trash2 className="h-4 w-4" /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
    </div>
  );
}

function Upload({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [bulk, setBulk] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const rows = bulk.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      const parts = line.split(/[:|,\t]/).map((p) => p.trim());
      return { product_id: product.id, credential: parts[0] ?? "", password: parts[1] ?? "", notes: parts.slice(2).join(" | ") || null };
    }).filter((r) => r.credential && r.password);
    if (rows.length === 0) return toast.error("No valid lines");
    setSaving(true);
    const { error } = await supabase.from("product_logins").insert(rows);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success(`Uploaded ${rows.length} logins`); onSaved(); }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
        <h2 className="text-lg font-bold">Upload logins</h2>
        <p className="mt-1 text-sm text-muted-foreground">For <strong>{product.name}</strong>. One per line: <code className="bg-muted px-1 rounded">email:password</code></p>
        <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={10}
          placeholder={"user1@mail.com:Pass123\nuser2@mail.com:Pass456"}
          className="mt-3 w-full rounded-md border bg-background p-3 text-sm font-mono" />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
          <button disabled={saving} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50">{saving ? "Uploading…" : "Upload"}</button>
        </div>
      </form>
    </div>
  );
}
