import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag, Loader2, Copy, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatNaira } from "@/lib/utils";

type Order = {
  id: string;
  product_name: string;
  price: number;
  delivered_credential: string | null;
  delivered_password: string | null;
  delivered_notes: string | null;
  delivered_login_email: string | null;
  delivered_login_password: string | null;
  delivered_twofa: string | null;
  delivered_recovery_email: string | null;
  delivered_recovery_password: string | null;
  created_at: string;
};

export const Route = createFileRoute("/dashboard/orders")({ component: Orders });

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).then(({ data, error }) => {
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
        <h1 className="text-2xl font-extrabold tracking-tight">My Products</h1>
        <p className="text-sm text-muted-foreground mt-1">Your purchased account details.</p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted">
            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 font-medium">No purchases yet</p>
          <p className="text-sm text-muted-foreground">Your purchased accounts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => <OrderCard key={o.id} order={o} onCopy={copy} />)}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order: o, onCopy }: { order: Order; onCopy: (v: string, l: string) => void }) {
  const loginEmail = o.delivered_login_email || o.delivered_credential || "";
  const loginPw = o.delivered_login_password || o.delivered_password || "";
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="font-semibold truncate">{o.product_name}</h2>
          <p className="text-xs text-muted-foreground">
            {new Date(o.created_at).toLocaleString()} · Ref {o.id.slice(0, 8)}
          </p>
        </div>
        <span className="font-bold text-primary">{formatNaira(o.price)}</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {loginEmail && <CredRow label="Login Email" value={loginEmail} onCopy={onCopy} />}
        {loginPw && <CredRow label="Login Password" value={loginPw} sensitive onCopy={onCopy} />}
        {o.delivered_twofa && <CredRow label="2FA / Backup Codes" value={o.delivered_twofa} sensitive onCopy={onCopy} />}
        {o.delivered_recovery_email && <CredRow label="Recovery Email" value={o.delivered_recovery_email} onCopy={onCopy} />}
        {o.delivered_recovery_password && <CredRow label="Recovery Password" value={o.delivered_recovery_password} sensitive onCopy={onCopy} />}
        {o.delivered_notes && <CredRow label="Notes" value={o.delivered_notes} onCopy={onCopy} />}
      </div>
    </div>
  );
}

function CredRow({ label, value, sensitive, onCopy }: { label: string; value: string; sensitive?: boolean; onCopy: (v: string, l: string) => void }) {
  const [show, setShow] = useState(!sensitive);
  return (
    <div className="rounded-md border bg-muted/30 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className="flex gap-1">
          {sensitive && (
            <button onClick={() => setShow(!show)} className="grid h-6 w-6 place-items-center rounded-md hover:bg-background">
              {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
          )}
          <button onClick={() => onCopy(value, label)} className="grid h-6 w-6 place-items-center rounded-md hover:bg-background">
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="mt-0.5 font-mono text-xs break-all">{show ? value : "••••••••••••"}</div>
    </div>
  );
}
