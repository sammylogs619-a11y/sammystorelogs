import { createFileRoute, Link } from "@tanstack/react-router";
import { Store, Plus, Clock, CheckCircle2, XCircle, Ban, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/seller")({
  component: SellerPage,
});

type Seller = { business_name: string; status: "pending" | "active" | "suspended" | "declined"; logo_url: string | null };

const STATUS_META: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  pending: { label: "Pending Approval", color: "amber", icon: Clock, desc: "Your application is being reviewed by an admin." },
  active: { label: "Approved Seller", color: "emerald", icon: CheckCircle2, desc: "Your store is live. Open the seller dashboard to manage products." },
  suspended: { label: "Suspended Seller", color: "rose", icon: Ban, desc: "Your seller account is suspended. Contact support." },
  declined: { label: "Declined Request", color: "rose", icon: XCircle, desc: "Your application was declined. You can submit a new request." },
};

function SellerPage() {
  const { user, loading } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("sellers").select("business_name,status,logo_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => { setSeller(data as Seller | null); setChecking(false); });
  }, [user]);

  if (loading || checking) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!seller) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Become a Seller</h1>
          <p className="text-sm text-muted-foreground mt-1">Open your own store and start selling digital accounts.</p>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50">
              <Store className="h-6 w-6 text-brand-blue" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Apply for seller account</h3>
              <p className="text-sm text-muted-foreground mt-1">Open your own store and start selling digital accounts. Admin review usually takes up to 24 hours.</p>
              <Link to="/become-seller" className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-blue text-brand-blue-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90">
                <Plus className="h-4 w-4" /> Send Request
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[seller.status];
  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Seller Status</h1>
        <p className="text-sm text-muted-foreground mt-1">Your seller application status and store info.</p>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-start gap-4">
          {seller.logo_url
            ? <img src={seller.logo_url} alt="" className="h-14 w-14 rounded-xl border object-cover" />
            : <div className={`grid h-14 w-14 place-items-center rounded-xl bg-${meta.color}-50`}><Store className={`h-6 w-6 text-${meta.color}-600`} /></div>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate">{seller.business_name}</h3>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-0.5 bg-${meta.color}-100 text-${meta.color}-700`}>
                <Icon className="h-3 w-3" /> {meta.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{meta.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {seller.status === "active" && (
                <Link to="/seller" className="inline-flex items-center gap-2 rounded-full bg-brand-blue text-brand-blue-foreground px-5 py-2 text-sm font-semibold hover:opacity-90">
                  Open Seller Dashboard
                </Link>
              )}
              {seller.status === "declined" && (
                <Link to="/become-seller" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:opacity-90">
                  <Plus className="h-4 w-4" /> Submit New Request
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
