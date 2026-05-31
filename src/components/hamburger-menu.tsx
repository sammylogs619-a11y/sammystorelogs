import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Menu, X, Home, Store, Mail, LogIn, UserPlus, LayoutDashboard, Wallet,
  ShoppingBag, User as UserIcon, LifeBuoy, LogOut, Briefcase, PackagePlus,
  Banknote, Package,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Item = { to: string; label: string; Icon: typeof Home };

const PUBLIC_TOP: Item[] = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/products", label: "Products", Icon: Store },
  { to: "/support", label: "Contact", Icon: Mail },
];

const AUTH_ITEMS: Item[] = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/dashboard/wallet", label: "Wallet", Icon: Wallet },
  { to: "/products", label: "Products", Icon: Store },
  { to: "/dashboard/orders", label: "Orders", Icon: ShoppingBag },
  { to: "/dashboard/catalog", label: "My Products", Icon: Package },
  { to: "/dashboard/settings", label: "Profile", Icon: UserIcon },
  { to: "/support", label: "Support", Icon: LifeBuoy },
];

const SELLER_ITEMS: Item[] = [
  { to: "/seller", label: "Seller Dashboard", Icon: Briefcase },
  { to: "/seller/products", label: "Add Product", Icon: PackagePlus },
  { to: "/seller/withdrawals", label: "Withdraw Funds", Icon: Banknote },
];

export function HamburgerMenu() {
  const { user, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!user) { setIsSeller(false); setUsername(""); return; }
    supabase.from("sellers").select("status").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIsSeller(data?.status === "active"));
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()
      .then(({ data }) => setUsername(data?.username ?? ""));
  }, [user]);

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    setOpen(false);
    navigate({ to: "/" });
  }

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0 flex flex-col">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>

        {/* Header */}
        <div className="px-5 py-4 border-b bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground font-black">
                S
              </div>
              <div className="min-w-0">
                <div className="font-extrabold leading-tight">SAMMY STORE</div>
                {user && (
                  <div className="text-[11px] text-muted-foreground truncate">
                    {username || user.email}
                  </div>
                )}
              </div>
            </div>
            <button onClick={close} aria-label="Close" className="h-8 w-8 grid place-items-center rounded-md hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          <Section items={PUBLIC_TOP} onClick={close} delay={0} />

          {!loading && !user && (
            <>
              <Divider />
              <Section
                items={[
                  { to: "/login", label: "Sign In", Icon: LogIn },
                  { to: "/signup", label: "Sign Up", Icon: UserPlus },
                ]}
                onClick={close}
                delay={3}
                accent
              />
            </>
          )}

          {!loading && user && (
            <>
              <Divider label="Account" />
              <Section items={AUTH_ITEMS} onClick={close} delay={3} />

              {isSeller && (
                <>
                  <Divider label="Seller" />
                  <Section items={SELLER_ITEMS} onClick={close} delay={8} />
                </>
              )}

              {isAdmin && (
                <>
                  <Divider label="Admin" />
                  <Section items={ADMIN_ITEMS} onClick={close} delay={11} />
                </>
              )}
            </>
          )}
        </nav>

        {/* Footer / logout */}
        {!loading && user && (
          <div className="border-t p-3">
            <button
              onClick={logout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm font-semibold hover:bg-rose-100 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({
  items, onClick, delay = 0, accent = false,
}: { items: Item[]; onClick: () => void; delay?: number; accent?: boolean }) {
  return (
    <ul className="px-2">
      {items.map((it, i) => (
        <li
          key={it.to + it.label}
          className="animate-in fade-in slide-in-from-right-2"
          style={{ animationDuration: "260ms", animationDelay: `${(delay + i) * 30}ms`, animationFillMode: "both" }}
        >
          <Link
            to={it.to}
            onClick={onClick}
            activeOptions={{ exact: it.to === "/" }}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
              ${accent
                ? "text-primary hover:bg-primary/10"
                : "text-foreground hover:bg-muted"}
              data-[status=active]:bg-primary data-[status=active]:text-primary-foreground`}
          >
            <it.Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>{it.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Divider({ label }: { label?: string }) {
  if (!label) return <div className="my-2 border-t" />;
  return (
    <div className="mt-3 mb-1 px-5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
  );
}
