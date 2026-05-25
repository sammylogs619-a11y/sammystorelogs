import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Store, Upload } from "lucide-react";

export const Route = createFileRoute("/become-seller")({
  head: () => ({ meta: [{ title: "Become a Seller · Sammy Store" }] }),
  component: BecomeSeller,
});

function BecomeSeller() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    supabase.from("sellers").select("status").eq("id", user.id).maybeSingle().then(({ data }) => {
      // If they already have a non-declined record, send them to their dashboard
      if (data && data.status !== "declined") navigate({ to: "/seller" });
    });
  }, [user, loading, navigate]);

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}_${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("seller_logos").upload(path, file);
    if (error) toast.error(error.message);
    else {
      const { data } = supabase.storage.from("seller_logos").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
      toast.success("Logo uploaded");
    }
    setUploading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Business name required");
    setSaving(true);
    const { error } = await supabase.rpc("register_seller", {
      _business_name: name.trim(),
      _business_description: desc.trim(),
      _logo_url: logoUrl || "",
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Request sent! Awaiting admin approval.");
      navigate({ to: "/dashboard/seller" });
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 grid place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary mx-auto">
          <Store className="h-6 w-6" />
        </div>
        <h1 className="mt-3 text-center text-2xl font-extrabold tracking-tight">Become a Seller</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">Open your own store on Sammy Store.</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Business name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Business description</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </label>
          <div>
            <span className="text-xs font-medium text-muted-foreground">Business logo</span>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 rounded-md border bg-muted overflow-hidden grid place-items-center">
                {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <Store className="h-5 w-5 text-muted-foreground" />}
              </div>
              <label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted inline-flex items-center gap-2">
                <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload logo"}
                <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <button disabled={saving} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Send Request
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Your application will be reviewed by an admin. You'll be notified once approved.
        </p>
      </form>
    </div>
  );
}
