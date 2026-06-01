import { useState } from "react";
import { Code2, X, Send, MessageCircle } from "lucide-react";

export function ContactDeveloperFAB() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label="Contact Developer"
      >
        <Code2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Contact Developer</span>
        <span className="sm:hidden">Dev</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Developer Contact</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Choose how you want to reach out</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-2.5">
              <a
                href="https://t.me/gcreativetechhimself"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border bg-background p-3.5 hover:bg-[#229ED9]/10 hover:border-[#229ED9] transition-all"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#229ED9] text-white">
                  <Send className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">Telegram</div>
                  <div className="text-xs text-muted-foreground truncate">@gcreativetechhimself</div>
                </div>
              </a>
              <a
                href="https://wa.me/2347062431475"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border bg-background p-3.5 hover:bg-[#25D366]/10 hover:border-[#25D366] transition-all"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#25D366] text-white">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">WhatsApp</div>
                  <div className="text-xs text-muted-foreground truncate">+234 706 243 1475</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
