import { useEffect, useState } from "react";
import { Headphones, X, MessageCircle, Send, Users, Megaphone } from "lucide-react";

const LINKS = [
  {
    label: "WhatsApp Chat",
    sub: "+234 816 313 7129",
    href: "https://wa.me/2348163137129",
    Icon: MessageCircle,
    color: "bg-emerald-500",
  },
  {
    label: "Telegram",
    sub: "@Sammy_store_logs",
    href: "https://t.me/Sammy_store_logs",
    Icon: Send,
    color: "bg-sky-500",
  },
  {
    label: "WhatsApp Community",
    sub: "Join the group",
    href: "https://chat.whatsapp.com/Jjf0FDLFmxMEDEV9Hjo1Yt",
    Icon: Users,
    color: "bg-emerald-600",
  },
  {
    label: "Telegram Channel",
    sub: "@sammystorelogss",
    href: "https://t.me/sammystorelogss",
    Icon: Megaphone,
    color: "bg-sky-600",
  },
];

export function SupportFAB() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open support center"
        className="fixed bottom-16 left-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/40 hover:scale-110 active:scale-95 transition-transform duration-200"
      >
        <Headphones className="h-5 w-5" />
        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Support Center"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[360px] rounded-2xl border bg-background shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <Headphones className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold leading-tight">Support Center</div>
                  <div className="text-[11px] text-muted-foreground">We reply fast</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2">
              {LINKS.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted transition-colors animate-in fade-in slide-in-from-left-2"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                >
                  <div className={`grid h-9 w-9 place-items-center rounded-full text-white ${l.color}`}>
                    <l.Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{l.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{l.sub}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
