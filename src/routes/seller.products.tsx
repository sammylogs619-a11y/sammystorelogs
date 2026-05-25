import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ImageIcon, Loader2, Package } from "lucide-react";
import { formatNaira } from "@/lib/utils";

type Category = { id: string; name: string };
type Product = {
  id: string; name: string; description: string | null; image_url: string | null;
  price: number; stock: number; category_id: string; is_active: boolean;
  category?: { name: string };
};

export const Route = createFileRoute("/seller/products")({ component: SellerProducts });

function SellerProducts() {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [p, c] = await Promise.all([
      supabase.from("products").select("*, category:categories(name)").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name").order("sort_order"),
    ]);
    if (p.error) toast.error(p.error.message);
    setItems((p.data as Product[]) ?? []);
    setCats((c.data as Category[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  async function del(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">My Products</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      {showForm && user && (
        <ProductForm sellerId={user.id} categories={cats} initial={editing}
          onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}

      {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        : items.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No products yet. Add your first product.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Product</th>
                  <th className="text-right p-3">Price</th>
                  <th className="text-right p-3">Stock</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-md bg-muted overflow-hidden grid place-items-center">
                          {p.image_url ? <img src={p.image_url} className="h-full w-full object-cover" alt="" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.category?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">{formatNaira(p.price)}</td>
                    <td className="p-3 text-right">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${p.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{p.stock}</span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(p); setShowForm(true); }} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => del(p.id)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

function ProductForm({ sellerId, categories, initial, onClose, onSaved }: {
  sellerId: string; categories: Category[]; initial: Product | null; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [cat, setCat] = useState(initial?.category_id ?? categories[0]?.id ?? "");
  const [img, setImg] = useState(initial?.image_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    const path = `${Date.now()}_${f.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("product_images").upload(path, f);
    if (error) toast.error(error.message);
    else { setImg(supabase.storage.from("product_images").getPublicUrl(path).data.publicUrl); toast.success("Uploaded"); }
    setUploading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price || !cat) return toast.error("Fill required fields");
    setSaving(true);
    const payload = {
      name: name.trim(), description: desc.trim() || null, image_url: img || null,
      price: parseFloat(price), category_id: cat, seller_id: sellerId,
    };
    const res = initial ? await supabase.from("products").update(payload).eq("id", initial.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (res.error) toast.error(res.error.message);
    else { toast.success(initial ? "Updated" : "Created"); onSaved(); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-3">
        <h2 className="text-lg font-bold">{initial ? "Edit product" : "Add product"}</h2>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <textarea value={desc ?? ""} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Description" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <input type="number" step="0.01" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (₦)" className="rounded-md border bg-background px-3 py-2 text-sm" />
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 rounded-md border bg-muted overflow-hidden grid place-items-center">
            {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
          </div>
          <label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted">
            {uploading ? "Uploading…" : "Upload image"}
            <input type="file" accept="image/*" onChange={upload} className="hidden" />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Stock is set by the number of available logins you upload.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
          <button disabled={saving} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
