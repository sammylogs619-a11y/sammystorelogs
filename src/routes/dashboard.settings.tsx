import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [telegram, setTelegram] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("username,telegram").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setUsername(data.username || "");
        setTelegram(data.telegram || "");
      }
    });
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ username: username.trim(), telegram: telegram.trim() || null }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your profile information.</p>
      </div>

      <form onSubmit={save} className="rounded-2xl border bg-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input value={user?.email || ""} disabled className="w-full rounded-lg border bg-muted px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Telegram username</label>
          <input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@yourname" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
        </div>
        <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue text-brand-blue-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </button>
      </form>
    </div>
  );
}
