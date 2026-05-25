import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet, CalendarCheck, Send, Plus, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ username: string; balance: number; telegram: string | null; created_at: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("username,balance,telegram,created_at").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile(data as any);
    });
  }, [user]);

  const displayName = profile?.username || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800 flex items-center justify-between">
        <span className="text-sm font-medium">👋 Welcome back, {displayName}!</span>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Your account at a glance.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card icon={<Wallet className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-50">
          <p className="text-sm text-muted-foreground">Account Balance</p>
          <p className="text-2xl font-extrabold text-emerald-600">${(profile?.balance ?? 0).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Wallet balance</p>
        </Card>
        <Card icon={<CalendarCheck className="h-5 w-5 text-brand-blue" />} bg="bg-blue-50">
          <p className="text-sm text-muted-foreground">Member Since</p>
          <p className="text-2xl font-extrabold">
            {profile?.created_at ? new Date(profile.created_at).toISOString().slice(0, 10) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Registered date</p>
        </Card>
        <Card icon={<Send className="h-5 w-5 text-orange-500" />} bg="bg-orange-50">
          <p className="text-sm text-muted-foreground">Telegram</p>
          <p className={`text-xl font-extrabold ${profile?.telegram ? "" : "text-red-500"}`}>{profile?.telegram || "Not Set"}</p>
          <p className="text-xs text-muted-foreground mt-1">Push notifications</p>
        </Card>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/15">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-extrabold">💳 Add Funds to Your Balance</h3>
            <p className="text-sm text-white/90 mt-1">Top up instantly with Crypto, PayPal, Skrill &amp; more. Your balance updates automatically after payment.</p>
            <p className="text-sm mt-2">Current balance: <span className="font-bold">${(profile?.balance ?? 0).toFixed(2)}</span></p>
          </div>
        </div>
        <Link to="/dashboard/wallet" className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-emerald-700 py-3 font-semibold hover:bg-white/90 transition-colors">
          <Plus className="h-5 w-5" /> Add Funds
        </Link>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-4 w-4 text-brand-blue" />
          <h3 className="font-semibold">Recent Notifications</h3>
        </div>
        <ul className="divide-y text-sm">
          <li className="py-3">Welcome to SAMMY STORE — explore the catalog to get started.</li>
          <li className="py-3">Your account was created successfully.</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ icon, bg, children }: { icon: React.ReactNode; bg: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${bg} mb-3`}>{icon}</div>
      {children}
    </div>
  );
}
