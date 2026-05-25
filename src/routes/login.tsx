import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — SAMMY STORE" },
      { name: "description", content: "Sign in to your SAMMY STORE account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) toast.error("Google sign-in failed");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground font-black">S</div>
            <span className="text-lg font-extrabold tracking-tight">SAMMY STORE</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome Back</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <button type="button" onClick={handleGoogle} className="mt-6 w-full inline-flex items-center justify-center gap-3 rounded-lg border bg-background py-2.5 text-sm font-medium hover:bg-muted transition-colors">
            <SiGoogle className="h-4 w-4 text-[#4285F4]" /> Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or continue with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-lg border bg-background pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border bg-background pl-10 pr-10 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-blue text-brand-blue-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign In
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-brand-blue font-medium hover:underline">Sign up here</Link>
          </p>
        </div>
      </main>

      <footer className="border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted-foreground text-center">© {new Date().getFullYear()} SAMMY STORE</div>
      </footer>
    </div>
  );
}
