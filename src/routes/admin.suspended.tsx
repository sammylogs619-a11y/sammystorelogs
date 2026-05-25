import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin-page";
import { UserX, RotateCcw, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Row = { id: string; username: string; email: string | null; suspended_reason: string | null; updated_at: string };

export const Route = createFileRoute("/admin/suspended")({ component: Page });

function Page() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles").select("id,username,email,suspended_reason,updated_at")
      .eq("is_suspended", true).order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Row[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function restore(id: string) {
    const { error } = await supabase.rpc("set_user_suspended", { _user_id: id, _suspended: false, _reason: "" });
    if (error) toast.error(error.message); else { toast.success("Restored"); load(); }
  }

  return (
    <AdminPage title="Suspended Users" description="Accounts blocked from purchasing.">
      {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        : items.length === 0
          ? <EmptyState icon={UserX} title="No suspended users" description="Users you suspend will appear here." />
          : (
            <div className="rounded-xl border bg-card divide-y">
              {items.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{u.username}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    {u.suspended_reason && <div className="text-xs text-rose-600 mt-1">{u.suspended_reason}</div>}
                  </div>
                  <button onClick={() => restore(u.id)} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-emerald-50">
                    <RotateCcw className="h-4 w-4" /> Restore
                  </button>
                </div>
              ))}
            </div>
          )}
    </AdminPage>
  );
}
