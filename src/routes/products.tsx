import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2, Package, ShoppingCart, ArrowLeft, Copy, CheckCircle2, Store } from "lucide-react";
import { formatNaira } from "@/lib/utils";

type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  stock: number;
  category_id: string;
  seller_id: string | null;
};
type Seller = { id: string; business_name: string; logo_url: string | null };

type Order = {
  id: string;
  product_name: string;
  delivered_credential: string;
  delivered_password: string;
  delivered_notes: string | null;
  price: number;
};

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products · Sammy Store" },
      { name: "description", content: "Browse digital accounts and services by category." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Record<string, Seller>>({});
  const [activeCat, setActiveCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [deliveredOrder, setDeliveredOrder] = useState<Order | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  async function reload() {
    const [c, p, s] = await Promise.all([
      supabase.from("categories").select("id,name,slug").order("sort_order"),
      supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("sellers").select("id,business_name,logo_url").eq("status", "active"),
    ]);
    setCategories((c.data as Category[]) ?? []);
    setProducts((p.data as Product[]) ?? []);
    const map: Record<string, Seller> = {};
    ((s.data as Seller[]) ?? []).forEach((x) => (map[x.id] = x));
    setSellers(map);
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(
    () => (activeCat === "all" ? products : products.filter((p) => p.category_id === activeCat)),
    [products, activeCat]
  );

  const adminProducts = filtered.filter((p) => !p.seller_id);
  const sellerGroups = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filtered.filter((p) => p.seller_id).forEach((p) => {
      const key = p.seller_id!;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filtered]);

  async function handleBuy(product: Product) {
    if (!user) {
      toast.info("Please sign in to purchase");
      navigate({ to: "/login" });
      return;
    }
    if (product.stock === 0) return;
    setBuying(product.id);
    const { data, error } = await supabase.rpc("purchase_product", { _product_id: product.id });
    if (error) {
      toast.error(error.message);
    } else if (data) {
      const order = data as unknown as Order;
      setDeliveredOrder(order);
      toast.success("Purchase complete — login delivered");
      reload();
    }
    setBuying(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/" className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-black">
              S
            </div>
            <span className="text-base font-extrabold tracking-tight">SAMMY STORE</span>
          </Link>
          <div className="ml-auto text-sm">
            {user ? (
              <Link to="/dashboard" className="hover:underline">My account</Link>
            ) : (
              <Link to="/login" className="hover:underline">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse digital accounts by category. Login is delivered instantly after purchase.
        </p>

        <div className="mt-5 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            <CatBtn active={activeCat === "all"} onClick={() => setActiveCat("all")}>All</CatBtn>
            {categories.map((c) => (
              <CatBtn key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
                {c.name}
              </CatBtn>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed bg-card p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">No products in this category</h3>
            <p className="mt-1 text-sm text-muted-foreground">Check back soon.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {adminProducts.length > 0 && (
              <Section title="SAMMY STORE LOGS" subtitle="Official store">
                <Grid products={adminProducts} buying={buying} onBuy={handleBuy} />
              </Section>
            )}

            {Object.entries(sellerGroups).map(([sellerId, list]) => {
              const s = sellers[sellerId];
              if (!s) return null;
              return (
                <Section
                  key={sellerId}
                  title={s.business_name.toUpperCase()}
                  subtitle="Seller store"
                  logo={s.logo_url}
                >
                  <Grid products={list} buying={buying} onBuy={handleBuy} />
                </Section>
              );
            })}
          </div>
        )}
      </section>

      {deliveredOrder && (
        <DeliveryModal order={deliveredOrder} onClose={() => setDeliveredOrder(null)} />
      )}
    </div>
  );
}

function Section({ title, subtitle, logo, children }: { title: string; subtitle: string; logo?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {logo ? (
          <img src={logo} alt="" className="h-10 w-10 rounded-lg object-cover border" />
        ) : (
          <div className="h-10 w-10 grid place-items-center rounded-lg bg-primary/10 text-primary">
            <Store className="h-5 w-5" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Grid({ products, buying, onBuy }: { products: Product[]; buying: string | null; onBuy: (p: Product) => void }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <article key={p.id} className="rounded-xl border bg-card overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="relative aspect-square bg-muted grid place-items-center overflow-hidden">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-10 w-10 text-muted-foreground" />
            )}
            {p.stock === 0 && (
              <div className="absolute inset-0 bg-black/60 grid place-items-center">
                <span className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white">Out of Stock</span>
              </div>
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
            {p.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-base font-bold text-primary">{formatNaira(p.price)}</span>
              <span className="text-[10px] text-muted-foreground">{p.stock > 0 ? `${p.stock} left` : "—"}</span>
            </div>
            <button
              onClick={() => onBuy(p)}
              disabled={p.stock === 0 || buying === p.id}
              className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground py-2 text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {buying === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
              {p.stock === 0 ? "Out of Stock" : "Buy now"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function CatBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"
      }`}
    >
      {children}
    </button>
  );
}

function DeliveryModal({ order, onClose }: { order: Order; onClose: () => void }) {
  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700 mx-auto">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mt-3 text-center text-lg font-bold">Login delivered</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">{order.product_name}</p>

        <div className="mt-5 space-y-2">
          <Creds label="Credential" value={order.delivered_credential} onCopy={copy} />
          <Creds label="Password" value={order.delivered_password} onCopy={copy} />
          {order.delivered_notes && <Creds label="Notes" value={order.delivered_notes} onCopy={copy} />}
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">You can also find this in your Orders.</p>

        <button onClick={onClose} className="mt-5 w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90">
          Done
        </button>
      </div>
    </div>
  );
}

function Creds({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string, l: string) => void }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <button onClick={() => onCopy(value, label)} className="grid h-7 w-7 place-items-center rounded-md hover:bg-background">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-1 font-mono text-sm break-all">{value}</div>
    </div>
  );
}
