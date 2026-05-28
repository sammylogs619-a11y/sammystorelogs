import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin-page";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tx = {
  id: string; user_id: string; type: string; amount: number; balance_after: number;
  description: string | null; created_at: string;
};

export const Route = createFileRoute("/admin/transactions")({ component: Page });

function Page() {
  const [items, setItems] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("wallet_transactions").select("*")
        .order("created_at", { ascending: false }).limit(300);
      if (error) toast.error(error.message);
      setItems((data as Tx[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <AdminPage title="Transactions" description="All wallet movements across the store.">
      {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        : items.length === 0
          ? <EmptyState icon={ArrowLeftRight} title="No transactions" description="Wallet activity will appear here." />
          : (
            <>
              {/* Mobile card list */}
              <ul className="sm:hidden space-y-2">
                {items.map((t) => (
                  <li key={t.id} className="rounded-xl border bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium capitalize truncate">{t.type.replace("_", " ")}</div>
                        {t.description && <div className="text-xs text-muted-foreground line-clamp-2">{t.description}</div>}
                        <div className="text-[10px] text-muted-foreground mt-1">{new Date(t.created_at).toLocaleString()}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {t.amount >= 0 ? "+" : ""}₦{Number(t.amount).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Bal ₦{Number(t.balance_after).toLocaleString()}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden sm:block rounded-xl border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="text-left p-3">When</th>
                        <th className="text-left p-3">Type</th>
                        <th className="text-left p-3 hidden sm:table-cell">Description</th>
                        <th className="text-right p-3">Amount</th>
                        <th className="text-right p-3 hidden md:table-cell">Balance after</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((t) => (
                        <tr key={t.id} className="border-t">
                          <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(t.created_at).toLocaleString()}</td>
                          <td className="p-3 capitalize">{t.type.replace("_", " ")}</td>
                          <td className="p-3 hidden sm:table-cell text-muted-foreground">{t.description}</td>
                          <td className={`p-3 text-right font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {t.amount >= 0 ? "+" : ""}₦{Number(t.amount).toLocaleString()}
                          </td>
                          <td className="p-3 text-right hidden md:table-cell">₦{Number(t.balance_after).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
    </AdminPage>
  );
}
