import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, KeyRound, ShoppingBag, Banknote, LogOut, Menu, X, Store, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AISupportFAB } from "@/components/ai-support-fab";

export const Route = createFileRoute("/seller")({
  head: () => ({ meta: [{ title: "Seller Dashboard · Sammy Store" }] }),
  component: SellerLayout,
});

const navItems = [
  { to: "/seller", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/seller/products", label: "Products", icon: Package },
  { to: "/seller/product-logins", label: "Product Logins", icon: KeyRound },
  { to: "/seller/orders", label: "Orders", icon: ShoppingBag },
  { to: "/seller/withdrawals", label: "Withdrawals", icon: Banknote },
];

function SellerLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [seller, setSeller] = useState<{ business_name: string; status: string; logo_url: string | null } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    supabase.from("sellers").select("business_name,status,logo_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) navigate({ to: "/become-seller" });
        else setSeller(data);
        setChecking(false);
      });
  }, [user, loading, navigate]);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  if (loading || checking || !user || !seller) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (seller.status !== "active") {
    const label = seller.status === "pending" ? "Pending Approval"
      : seller.status === "declined" ? "Application Declined"
      : "Seller Suspended";
    const desc = seller.status === "pending"
      ? "Your seller application is awaiting admin review. You'll get access to your store as soon as it's approved."
      : seller.status === "declined"
      ? "Your seller application was declined. You can resubmit a new request from your dashboard."
      : "Your seller account has been suspended. Contact support to reactivate.";
    const color = seller.status === "pending" ? "amber" : seller.status === "declined" ? "rose" : "rose";
    return (
      <div className="min-h-screen grid place-items-center p-4 bg-muted/30">
        <div className="max-w-sm text-center rounded-2xl border bg-card p-6">
          <span className={`inline-block text-xs rounded-full px-3 py-1 bg-${color}-100 text-${color}-700 font-medium`}>{label}</span>
          <h1 className="mt-3 text-xl font-bold">{label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          <Link to="/dashboard" className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button onClick={() => setMenuOpen(true)} className="md:hidden grid h-9 w-9 place-items-center rounded-lg border">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-black">S</div>
            <span className="text-lg font-extrabold tracking-tight hidden sm:inline">SAMMY STORE</span>
          </Link>
          <span className="ml-auto text-xs uppercase tracking-wide text-muted-foreground hidden sm:inline">Seller panel</span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 grid md:grid-cols-[240px_1fr] gap-6">
        <aside className="hidden md:block">
          <Sidebar seller={seller} onLogout={logout} />
        </aside>

        {menuOpen && <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMenuOpen(false)} />}
        <aside className={`md:hidden fixed top-0 left-0 z-50 h-full w-[82%] max-w-xs bg-card shadow-2xl transition-transform ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-bold">Menu</span>
            <button onClick={() => setMenuOpen(false)}><X className="h-5 w-5" /></button>
          </div>
          <div className="p-4"><Sidebar seller={seller} onLogout={logout} /></div>
        </aside>

        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}

function Sidebar({ seller, onLogout }: { seller: { business_name: string; logo_url: string | null }; onLogout: () => void }) {
  const location = useLocation();
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-3 pb-4 border-b">
        {seller.logo_url ? <img src={seller.logo_url} alt="" className="h-11 w-11 rounded-full object-cover border" />
          : <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary"><Store className="h-5 w-5" /></div>}
        <div className="min-w-0">
          <p className="font-semibold truncate">{seller.business_name}</p>
          <p className="text-xs text-muted-foreground">Seller</p>
        </div>
      </div>
      <nav className="mt-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted ${active ? "bg-primary/10 text-primary" : ""}`}>
              <Icon className="h-4 w-4" /> {item.label}
            </Link>
          );
        })}
        <button onClick={onLogout} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-muted">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </nav>
    </div>
  );
}
