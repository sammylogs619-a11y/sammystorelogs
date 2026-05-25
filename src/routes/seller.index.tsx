import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Package, ShoppingBag, Banknote } from "lucide-react";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/seller/")({ component: SellerHome });

function SellerHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ balance: 0, products: 0, orders: 0, pendingWd: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [s, p, o, w] = await Promise.all([
        supabase.from("sellers").select("balance").eq("id", user.id).maybeSingle(),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("seller_id", user.id),
        supabase.from("orders").select("id, products!inner(seller_id)", { count: "exact", head: true }).eq("products.seller_id", user.id),
        supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("seller_id", user.id).eq("status", "pending"),
      ]);
      setStats({
        balance: Number(s.data?.balance ?? 0),
        products: p.count ?? 0,
        orders: o.count ?? 0,
        pendingWd: w.count ?? 0,
      });
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Seller Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your products, orders, and payouts.</p>
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card icon={Wallet} label="Balance" value={formatNaira(stats.balance)} accent="text-emerald-600" />
        <Card icon={Package} label="Products" value={String(stats.products)} accent="text-blue-600" />
        <Card icon={ShoppingBag} label="Orders" value={String(stats.orders)} accent="text-violet-600" />
        <Card icon={Banknote} label="Pending withdrawals" value={String(stats.pendingWd)} accent="text-amber-600" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/seller/products" className="rounded-xl border bg-card p-4 hover:shadow-sm">
          <Package className="h-5 w-5 text-primary" /><div className="mt-2 font-semibold">Add a product</div>
          <p className="text-xs text-muted-foreground mt-1">List a new digital product on the marketplace.</p>
        </Link>
        <Link to="/seller/withdrawals" className="rounded-xl border bg-card p-4 hover:shadow-sm">
          <Banknote className="h-5 w-5 text-primary" /><div className="mt-2 font-semibold">Request payout</div>
          <p className="text-xs text-muted-foreground mt-1">Withdraw your earnings to your bank account.</p>
        </Link>
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Icon className={`h-5 w-5 ${accent}`} />
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-extrabold ${accent}`}>{value}</div>
    </div>
  );
}
