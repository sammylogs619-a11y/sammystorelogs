import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Search, Mail, Gift, Gem, Shield, Package, Code2, Wallet, Gamepad2, ShoppingBag, Blocks, AtSign } from "lucide-react";
import {
  SiActivision,
  SiDiscord,
  SiFacebook,
  SiRockstargames,
  SiGmail,
  SiGoogle,
  SiInstagram,
  SiNetflix,
  SiPinterest,
  SiProtonmail,
  SiReddit,
  SiRoblox,
  SiSnapchat,
  SiSpotify,
  SiSteam,
  SiTelegram,
  SiTiktok,
  SiTwitch,
  SiX,
  SiVk,
  SiWechat,
  SiWhatsapp,
  SiYoutube,
} from "react-icons/si";
import { FaLinkedin, FaMicrosoft } from "react-icons/fa";
import type { IconType } from "react-icons";
import type { LucideIcon } from "lucide-react";

type Category = {
  name: string;
  slug: string;
  products: number;
  isNew?: boolean;
  Icon: IconType | LucideIcon;
  color: string;
};

const categories: Category[] = [
  { name: "Amazon Prime", slug: "amazon-prime", products: 4, isNew: true, Icon: ShoppingBag, color: "text-[#FF9900]" },
  { name: "Call Of Duty", slug: "call-of-duty", products: 1, isNew: true, Icon: SiActivision, color: "text-emerald-700" },
  { name: "Crypto Wallets & Accounts", slug: "crypto-accounts", products: 45, isNew: true, Icon: Wallet, color: "text-amber-500" },
  { name: "Discord", slug: "discord", products: 24, Icon: SiDiscord, color: "text-[#5865F2]" },
  { name: "Email Accounts", slug: "email-accounts", products: 82, Icon: Mail, color: "text-sky-600" },
  { name: "Email Services", slug: "email-services", products: 23, Icon: Mail, color: "text-indigo-600" },
  { name: "Facebook", slug: "facebook", products: 327, Icon: SiFacebook, color: "text-[#1877F2]" },
  { name: "GTA 5", slug: "gta-5", products: 1, Icon: SiRockstargames, color: "text-amber-500" },
  { name: "Gaming Accounts", slug: "gaming-accounts", products: 7, Icon: Gamepad2, color: "text-violet-600" },
  { name: "Gift Cards", slug: "gift-cards", products: 2, Icon: Gift, color: "text-rose-500" },
  { name: "Gift Cards", slug: "giftcards", products: 3, Icon: Gift, color: "text-pink-500" },
  { name: "Gmail", slug: "gmail", products: 257, Icon: SiGmail, color: "text-[#EA4335]" },
  { name: "Google", slug: "google", products: 526, Icon: SiGoogle, color: "text-[#4285F4]" },
  { name: "Instagram", slug: "instagram", products: 1216, Icon: SiInstagram, color: "text-[#E1306C]" },
  { name: "LinkedIn", slug: "linkedin", products: 60, Icon: FaLinkedin, color: "text-[#0A66C2]" },
  { name: "Microsoft", slug: "microsoft", products: 81, Icon: FaMicrosoft, color: "text-[#5E5E5E]" },
  { name: "Minecraft", slug: "minecraft", products: 7, Icon: Blocks, color: "text-emerald-600" },
  { name: "Netflix", slug: "netflix", products: 24, Icon: SiNetflix, color: "text-[#E50914]" },
  { name: "Pinterest", slug: "pinterest", products: 16, Icon: SiPinterest, color: "text-[#E60023]" },
  { name: "ProtonMail", slug: "protonmail", products: 5, Icon: SiProtonmail, color: "text-[#6D4AFF]" },
  { name: "Reddit", slug: "reddit", products: 12, Icon: SiReddit, color: "text-[#FF4500]" },
  { name: "Roblox", slug: "roblox", products: 4, Icon: SiRoblox, color: "text-[#E2231A]" },
  { name: "Snapchat", slug: "snapchat", products: 52, Icon: SiSnapchat, color: "text-yellow-500" },
  { name: "Software", slug: "software", products: 229, Icon: Code2, color: "text-slate-700" },
  { name: "Spotify", slug: "spotify", products: 7, Icon: SiSpotify, color: "text-[#1DB954]" },
  { name: "Steam", slug: "steam", products: 6, Icon: SiSteam, color: "text-[#1b2838]" },
  { name: "Telegram", slug: "telegram", products: 200, Icon: SiTelegram, color: "text-[#229ED9]" },
  { name: "Templates", slug: "templates", products: 1, Icon: Package, color: "text-amber-600" },
  { name: "TikTok", slug: "tiktok", products: 137, Icon: SiTiktok, color: "text-black" },
  { name: "Twitch", slug: "twitch", products: 11, Icon: SiTwitch, color: "text-[#9146FF]" },
  { name: "Twitter", slug: "twitter", products: 147, Icon: SiX, color: "text-black" },
  { name: "Uncategorized", slug: "uncategorized", products: 76, Icon: Gem, color: "text-slate-500" },
  { name: "VK", slug: "vk", products: 3, Icon: SiVk, color: "text-[#0077FF]" },
  { name: "VPN Accounts", slug: "vpn", products: 11, Icon: Shield, color: "text-emerald-600" },
  { name: "VPN Services", slug: "vpn-services", products: 20, Icon: Shield, color: "text-teal-600" },
  { name: "WeChat", slug: "wechat", products: 8, Icon: SiWechat, color: "text-[#07C160]" },
  { name: "WhatsApp", slug: "whatsapp", products: 174, Icon: SiWhatsapp, color: "text-[#25D366]" },
  { name: "Yahoo Mail", slug: "yahoo-mail", products: 12, Icon: AtSign, color: "text-[#6001D2]" },
  { name: "YouTube", slug: "youtube", products: 43, Icon: SiYoutube, color: "text-[#FF0000]" },
  { name: "YouTube Premium", slug: "youtube-premium", products: 10, Icon: SiYoutube, color: "text-[#FF0000]" },
];

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Browse Categories — SAMMY STORE Catalog" },
      {
        name: "description",
        content:
          "Explore all product categories on SAMMY STORE — social, email, gaming, software, VPN, gift cards and more.",
      },
      { property: "og:title", content: "Catalog — SAMMY STORE" },
      {
        property: "og:description",
        content: "Browse every category in the SAMMY STORE marketplace.",
      },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [q, setQ] = useState("");
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase().trim()),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground font-black">
              S
            </div>
            <span className="text-lg font-extrabold tracking-tight">SAMMY STORE</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl bg-brand-blue text-brand-blue-foreground px-6 py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Browse Categories
          </h1>
          <p className="mt-3 mx-auto max-w-2xl opacity-90">
            Explore all product categories and find what you're looking for.
          </p>
        </div>

        <div className="mt-6 mx-auto max-w-xl flex items-center rounded-lg border bg-background overflow-hidden">
          <Search className="ml-3 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
            placeholder="Search categories"
          />
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "category" : "categories"}
        </div>

        <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((c) => {
            const Icon = c.Icon;
            return (
              <a
                key={c.slug}
                href="#"
                className="group relative rounded-xl border bg-card p-4 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {c.isNew && (
                  <span className="absolute top-2 right-2 rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5">
                    NEW
                  </span>
                )}
                <div className="h-14 w-14 rounded-2xl bg-white border grid place-items-center shadow-sm">
                  <Icon className={`h-8 w-8 ${c.color}`} />
                </div>
                <h3 className="mt-3 text-sm font-semibold leading-tight">{c.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.products} {c.products === 1 ? "product" : "products"}
                </p>
              </a>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">
            No categories match "{q}".
          </p>
        )}
      </main>

      <footer className="mt-8 border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} SAMMY STORE
        </div>
      </footer>
    </div>
  );
}
