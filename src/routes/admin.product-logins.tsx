import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin-page";
import { KeyRound, Plus, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Product = { id: string; name: string; stock: number };
type Login = {
  id: string;
  product_id: string;
  credential: string;
  password: string;
  notes: string | null;
  status: string;
  created_at: string;
};

export const Route = createFileRoute("/admin/product-logins")({
  component: AdminLogins,
});

function AdminLogins() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [logins, setLogins] = useState<Login[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadProducts() {
    const { data } = await supabase.from("products").select("id,name,stock").order("name");
    setProducts((data as Product[]) ?? []);
    if (data && data.length && !productId) setProductId(data[0].id);
    setLoading(false);
  }

  async function loadLogins() {
    if (!productId) return;
    const { data, error } = await supabase
      .from("product_logins")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setLogins((data as Login[]) ?? []);
  }

  useEffect(() => {
    loadProducts();
  }, []);
  useEffect(() => {
    loadLogins();
  }, [productId]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this login?")) return;
    const { error } = await supabase.from("product_logins").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      loadLogins();
      loadProducts();
    }
  }

  const current = products.find((p) => p.id === productId);

  return (
    <AdminPage
      title="Product Logins"
      description="Credentials are delivered automatically when a user buys the product."
      actions={
        products.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Upload logins
          </button>
        )
      }
    >
      {showForm && current && (
        <UploadLogins
          product={current}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadLogins();
            loadProducts();
          }}
        />
      )}

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No products to load logins for"
          description="Create a product first, then upload its login credentials here."
        />
      ) : (
        <>
          <div className="rounded-xl border bg-card p-4">
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Product
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — stock {p.stock}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Credential</th>
                    <th className="text-left p-3">Password</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logins.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">
                        No logins uploaded for this product.
                      </td>
                    </tr>
                  ) : (
                    logins.map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="p-3 font-mono text-xs truncate max-w-[200px]">
                          {l.credential}
                        </td>
                        <td className="p-3 font-mono text-xs truncate max-w-[200px]">
                          {l.password}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                              l.status === "available"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {l.status === "available" && (
                            <button
                              onClick={() => handleDelete(l.id)}
                              className="grid h-8 w-8 place-items-center rounded-md hover:bg-destructive/10 text-destructive ml-auto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminPage>
  );
}

function UploadLogins({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [bulk, setBulk] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rows = bulk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/[:|,\t]/).map((p) => p.trim());
        return {
          product_id: product.id,
          credential: parts[0] ?? "",
          password: parts[1] ?? "",
          notes: parts.slice(2).join(" | ") || null,
        };
      })
      .filter((r) => r.credential && r.password);

    if (rows.length === 0) {
      toast.error("No valid lines found");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("product_logins").insert(rows);
    if (error) toast.error(error.message);
    else {
      toast.success(`Uploaded ${rows.length} logins`);
      onSaved();
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold">Upload logins</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For <span className="font-medium text-foreground">{product.name}</span>. One per line:
          <code className="ml-1 rounded bg-muted px-1 py-0.5 text-xs">email:password</code> (or
          separated by <code>|</code>, <code>,</code> or tab).
        </p>
        <textarea
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          rows={10}
          placeholder={"user1@mail.com:Pass123\nuser2@mail.com:Pass456 | recovery@mail.com"}
          className="mt-3 w-full rounded-md border bg-background p-3 text-sm font-mono"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Stock count is updated automatically based on available logins.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}
