import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag, Loader2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Order = {
  id: string;
  product_name: string;
  price: number;
  delivered_credential: string;
  delivered_password: string;
  delivered_notes: string | null;
  created_at: string;
};

export const Route = createFileRoute("/dashboard/orders")({
  component: Orders,
});

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setOrders((data as Order[]) ?? []);
        setLoading(false);
      });
  }, []);

  function copy(v: string, label: string) {
    navigator.clipboard.writeText(v);
    toast.success(`${label} copied`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your purchases and delivered logins.
        </p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted">
            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 font-medium">No orders yet</p>
          <p className="text-sm text-muted-foreground">Your purchases will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-semibold">{o.product_name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="font-bold text-primary">${Number(o.price).toFixed(2)}</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <CredRow label="Credential" value={o.delivered_credential} onCopy={copy} />
                <CredRow label="Password" value={o.delivered_password} onCopy={copy} />
                {o.delivered_notes && (
                  <CredRow label="Notes" value={o.delivered_notes} onCopy={copy} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CredRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (v: string, l: string) => void;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <button
          onClick={() => onCopy(value, label)}
          className="grid h-6 w-6 place-items-center rounded-md hover:bg-background"
        >
          <Copy className="h-3 w-3" />
        </button>
      </div>
      <div className="mt-0.5 font-mono text-xs break-all">{value}</div>
    </div>
  );
}
