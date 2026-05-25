import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Loader2 } from "lucide-react";
import { formatNaira } from "@/lib/utils";

type Row = {
  id: string; product_name: string; price: number; created_at: string;
  user_id: string;
  product_id: string;
  buyer?: { username: string; email: string | null } | null;
};

export const Route = createFileRoute("/seller/orders")({ component: Page });

function Page() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Fetch order ids for products belonging to seller
      const { data: prods } = await supabase.from("products").select("id").eq("seller_id", user.id);
      const ids = (prods ?? []).map((p) => p.id);
      if (ids.length === 0) { setRows([]); setLoading(false); return; }
      const { data } = await supabase
        .from("orders").select("id,product_name,price,created_at,user_id,product_id")
        .in("product_id", ids).order("created_at", { ascending: false }).limit(200);
      const orders = (data as Row[]) ?? [];
      // Fetch buyer profiles
      const buyerIds = Array.from(new Set(orders.map((o) => o.user_id)));
      const { data: profs } = await supabase.from("profiles").select("id,username,email").in("id", buyerIds);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      orders.forEach((o) => { o.buyer = map.get(o.user_id) ?? null; });
      setRows(orders);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Orders</h1>
      {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Buyer</th>
                  <th className="text-left p-3">Product</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-left p-3 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{r.buyer?.username ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.buyer?.email}</div>
                    </td>
                    <td className="p-3">{r.product_name}</td>
                    <td className="p-3 text-right font-semibold text-emerald-600">{formatNaira(r.price)}</td>
                    <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
