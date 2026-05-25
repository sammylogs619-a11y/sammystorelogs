import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin-page";
import { Package, Plus, Pencil, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  stock: number;
  category_id: string;
  is_active: boolean;
  category?: { name: string };
};

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  async function load() {
    setLoading(true);
    const [p, c] = await Promise.all([
      supabase
        .from("products")
        .select("*, category:categories(name)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name,slug").order("sort_order"),
    ]);
    if (p.error) toast.error(p.error.message);
    if (c.error) toast.error(c.error.message);
    setProducts((p.data as Product[]) ?? []);
    setCategories((c.data as Category[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? Its logins will also be removed.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Product deleted");
      load();
    }
  }

  return (
    <AdminPage
      title="Products"
      description="Manage your product catalog."
      actions={
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add product
        </button>
      }
    >
      {showForm && (
        <ProductForm
          categories={categories}
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to start selling in the store."
        />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Product</th>
                  <th className="text-left p-3 hidden md:table-cell">Category</th>
                  <th className="text-right p-3">Price</th>
                  <th className="text-right p-3">Stock</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-md bg-muted overflow-hidden grid place-items-center">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {p.category?.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">{p.category?.name}</td>
                    <td className="p-3 text-right font-medium">${Number(p.price).toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          p.stock > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(p);
                            setShowForm(true);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="grid h-8 w-8 place-items-center rounded-md hover:bg-destructive/10 text-destructive"
                        >
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

function ProductForm({
  categories,
  initial,
  onClose,
  onSaved,
}: {
  categories: Category[];
  initial: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? categories[0]?.id ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}_${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("product_images").upload(path, file);
    if (error) {
      toast.error(error.message);
    } else {
      const { data } = supabase.storage.from("product_images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
      toast.success("Image uploaded");
    }
    setUploading(false);
  }

  async function addCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: trimmed, slug, is_custom: true })
      .select()
      .single();
    if (error) toast.error(error.message);
    else if (data) {
      toast.success("Category added");
      categories.push({ id: data.id, name: data.name, slug: data.slug });
      setCategoryId(data.id);
      setNewCategory("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) {
      toast.error("Fill all required fields");
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      image_url: imageUrl || null,
      price: parseFloat(price),
      category_id: categoryId,
    };
    const res = initial
      ? await supabase.from("products").update(payload).eq("id", initial.id)
      : await supabase.from("products").insert(payload);
    if (res.error) toast.error(res.error.message);
    else {
      toast.success(initial ? "Product updated" : "Product created");
      onSaved();
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-bold">{initial ? "Edit product" : "Add product"}</h2>

        <div className="mt-4 space-y-3">
          <Field label="Name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (USD)">
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Category">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex gap-2">
            <input
              placeholder="Add custom category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addCategory}
              className="rounded-md border px-3 text-sm hover:bg-muted"
            >
              Add
            </button>
          </div>

          <Field label="Product image">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 rounded-md border bg-muted overflow-hidden grid place-items-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted">
                {uploading ? "Uploading…" : "Upload image"}
                <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </label>
            </div>
          </Field>

          <p className="text-xs text-muted-foreground">
            Stock is automatically set by the number of available logins you upload on
            the Product Logins page.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
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
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
