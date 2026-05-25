import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supportChat } from "@/lib/support.functions";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Loader2, Headphones, Sparkles } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { toast } from "sonner";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "AI Support · Sammy Store" },
      { name: "description", content: "Get instant help from our AI support assistant." },
    ],
  }),
  component: SupportPage,
});

type Msg = { role: "user" | "assistant"; content: string; created_at?: string };

function SupportPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chat = useServerFn(supportChat);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    supabase.from("support_chats").select("role,content,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: true }).limit(50)
      .then(({ data }) => setMessages((data as Msg[]) ?? []));
  }, [user, loading, navigate]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const r = await chat({ data: { message: text } });
      setMessages((m) => [...m, { role: "assistant", content: r.reply }]);
    } catch (err: any) {
      toast.error(err?.message ?? "AI request failed");
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I hit an error. Please try again or message Contact Developer on Telegram." }]);
    } finally {
      setSending(false);
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white relative overflow-hidden">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />

      <header className="relative border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Link to="/dashboard" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="relative grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
            <Headphones className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold flex items-center gap-2">Sammy AI Support <Sparkles className="h-3.5 w-3.5 text-amber-300" /></div>
            <div className="text-xs text-emerald-400">● Online</div>
          </div>
          <a
            href="https://t.me/gcreativetechhimself"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#7ec8e6] px-3 py-1.5 text-xs font-medium border border-[#229ED9]/40"
          >
            <SiTelegram className="h-3.5 w-3.5" /> Telegram
          </a>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 py-6 pb-32 space-y-3">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Headphones className="h-6 w-6" />
            </div>
            <h2 className="mt-3 text-lg font-bold">Hi! I'm Sammy AI 👋</h2>
            <p className="mt-1 text-sm text-white/70">
              Ask me about wallet funding, payments, product delivery, coupons, withdrawals, or anything Sammy Store.
            </p>
            <div className="mt-4 grid sm:grid-cols-2 gap-2 text-left">
              {[
                "How do I fund my wallet with crypto?",
                "My payment is pending, what do I do?",
                "How do I become a seller?",
                "I got wrong login credentials",
              ].map((s) => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-xs rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition text-left">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
              m.role === "user"
                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm"
                : "bg-white/10 backdrop-blur-md border border-white/10 rounded-bl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start animate-in fade-in duration-200">
            <div className="rounded-2xl rounded-bl-sm bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </main>

      <form onSubmit={send} className="fixed bottom-0 inset-x-0 z-20 border-t border-white/10 backdrop-blur-xl bg-slate-950/70">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message…"
            disabled={sending}
            className="flex-1 rounded-full bg-white/10 border border-white/10 px-4 py-2.5 text-sm placeholder:text-white/40 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
