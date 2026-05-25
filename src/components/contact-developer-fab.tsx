import { Send } from "lucide-react";

export function ContactDeveloperFAB() {
  return (
    <a
      href="https://t.me/gcreativetechhimself"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#229ED9] text-white px-4 py-2.5 text-xs font-semibold shadow-lg shadow-[#229ED9]/30 hover:bg-[#1b85b8] hover:scale-105 active:scale-95 transition-all duration-200"
      aria-label="Contact Developer on Telegram"
    >
      <Send className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Contact Developer</span>
      <span className="sm:hidden">Dev</span>
    </a>
  );
}
