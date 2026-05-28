import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, LogIn, LogOut, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { HamburgerMenu } from "@/components/hamburger-menu";

/** Header auth area: shows Sign in/Sign up when logged out, avatar + Dashboard + Logout when logged in. */
export function AuthNav() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>("");
  const [hasSeller, setHasSeller] = useState(false);

  useEffect(() => {
    if (!user) { setUsername(""); setHasSeller(false); return; }
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()
      .then(({ data }) => setUsername(data?.username ?? ""));
    supabase.from("sellers").select("status").eq("id", user.id).maybeSingle()
      .then(({ data }) => setHasSeller(data?.status === "active"));
  }, [user]);

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  if (loading) return <div className="h-7 w-32 rounded-md bg-muted animate-pulse" />;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="hidden sm:inline-flex items-center gap-1 rounded-md px-3 py-1 text-sm hover:bg-background">
          <LogIn className="h-4 w-4" /> Sign in
        </Link>
        <Link to="/signup" className="hidden sm:inline-flex items-center gap-1 rounded-md bg-brand text-brand-foreground px-3 py-1 text-sm hover:opacity-90">
          <UserPlus className="h-4 w-4" /> Sign up
        </Link>
        <HamburgerMenu />
      </div>
    );
  }

  const initial = (username || user.email || "U").charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 rounded-full border px-2 py-1 bg-background/50">
        <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[10px] font-bold">
          {initial}
        </div>
        <span className="text-xs font-medium max-w-[100px] truncate">{username || user.email}</span>
      </div>
      <Link
        to={hasSeller ? "/seller" : "/dashboard"}
        className="hidden sm:inline-flex items-center gap-1 rounded-md bg-brand-blue text-brand-blue-foreground px-3 py-1 text-sm hover:opacity-90"
      >
        <LayoutDashboard className="h-4 w-4" /> Dashboard
      </Link>
      <button
        onClick={logout}
        className="hidden sm:inline-flex items-center gap-1 rounded-md border px-3 py-1 text-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
      <HamburgerMenu />
    </div>
  );
}
