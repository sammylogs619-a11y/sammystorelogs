import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, Wallet, Store, Settings, LogOut, Menu, X, Bell, ShoppingBag, Layers, LifeBuoy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AISupportFAB } from "@/components/ai-support-fab";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — SAMMY STORE" }],
  }),
  component: DashboardLayout,
});

const navItems = [
  { to: "/dashboard", label: "Overview", icon: Home, exact: true },
  { to: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { to: "/dashboard/seller", label: "Become a Seller", icon: Store },
  { to: "/dashboard/catalog", label: "Catalog", icon: Layers },
  { to: "/dashboard/orders", label: "My Orders", icon: ShoppingBag },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.username) setUsername(data.username);
    });
  }, [user]);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button onClick={() => setMenuOpen(true)} className="md:hidden grid h-9 w-9 place-items-center rounded-lg border" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground font-black">S</div>
            <span className="text-lg font-extrabold tracking-tight hidden sm:inline">SAMMY STORE</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-lg border relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 grid place-items-center rounded-full bg-red-500 text-white text-[10px]">2</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-muted/40">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                {(username || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{username || user.email}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 grid md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar - desktop */}
        <aside className="hidden md:block">
          <Sidebar username={username || user.email || "User"} onLogout={handleLogout} />
        </aside>

        {/* Slide-over - mobile */}
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMenuOpen(false)} />
        )}
        <aside className={`md:hidden fixed top-0 left-0 z-50 h-full w-[82%] max-w-xs bg-slate-900 text-white shadow-2xl transition-transform ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="font-bold">Menu</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
          <div className="p-4">
            <Sidebar dark username={username || user.email || "User"} onLogout={handleLogout} />
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
      <AISupportFAB />
    </div>
  );
}

function Sidebar({ username, onLogout, dark = false }: { username: string; onLogout: () => void; dark?: boolean }) {
  const location = useLocation();
  const base = dark
    ? "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
    : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors";
  const active = dark ? "bg-white/10" : "bg-brand-blue/10 text-brand-blue";

  return (
    <div className={dark ? "" : "rounded-2xl border bg-card p-4"}>
      <div className={`flex items-center gap-3 ${dark ? "pb-4 border-b border-white/10" : "pb-4 border-b"}`}>
        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{username}</p>
          <p className={`text-xs ${dark ? "text-slate-300" : "text-muted-foreground"}`}>Member</p>
        </div>
      </div>
      <nav className="mt-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to} className={`${base} ${isActive ? active : ""}`}>
              <Icon className="h-4 w-4" /> {item.label}
            </Link>
          );
        })}
        <a href="#" className={base}>
          <LifeBuoy className="h-4 w-4" /> Live Support
        </a>
        <button onClick={onLogout} className={`${base} w-full text-red-500`}>
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </nav>
    </div>
  );
}
