import { Link } from "@tanstack/react-router";
import { Headphones } from "lucide-react";

export function AISupportFAB() {
  return (
    <Link
      to="/support"
      className="fixed bottom-4 right-4 z-40 group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-4 py-3 text-sm font-semibold shadow-xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
      aria-label="AI Support"
    >
      <span className="relative grid h-6 w-6 place-items-center rounded-full bg-white/15">
        <Headphones className="h-3.5 w-3.5" />
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
      </span>
      <span className="hidden sm:inline">AI Support</span>
    </Link>
  );
}
