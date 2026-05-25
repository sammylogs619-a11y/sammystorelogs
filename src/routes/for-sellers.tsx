import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/for-sellers")({
  head: () => ({
    meta: [
      { title: "For Sellers — SAMMY STORE Rules & Requirements" },
      {
        name: "description",
        content:
          "Seller rules and requirements for SAMMY STORE: product quality, descriptions, delivery, support, disputes, and commission fees.",
      },
      { property: "og:title", content: "For Sellers — SAMMY STORE" },
      {
        property: "og:description",
        content:
          "Everything sellers need to know to run a store on SAMMY STORE.",
      },
    ],
  }),
  component: ForSellersPage,
});

type Rule = { title: string; body: string };

const sellerRules: Rule[] = [
  {
    title: "Product Quality",
    body: "All accounts must be working and valid. Selling invalid accounts results in immediate suspension.",
  },
  {
    title: "Accurate Descriptions",
    body: "Product descriptions must be accurate. Include all relevant details and limitations.",
  },
  {
    title: "Delivery Time",
    body: "Instant delivery required. Ensure sufficient stock. Out-of-stock products must be disabled.",
  },
  {
    title: "Customer Support",
    body: "Respond to buyer messages within 24 hours. Provide support for purchased accounts.",
  },
  {
    title: "Dispute Cooperation",
    body: "Cooperate with the dispute resolution process. Failure to respond may result in automatic refund.",
  },
  {
    title: "Commission Fees",
    body: "5% commission on all sales. Withdrawals processed within 2-3 business days.",
  },
];

const prohibited: Rule[] = [
  {
    title: "Unauthorized Accounts",
    body: "Accounts obtained without the owner's authorization or via unauthorized third-party access.",
  },
  {
    title: "Illegal Content",
    body: "Any content that violates applicable local or international laws.",
  },
  {
    title: "Unlicensed Software",
    body: "Unlicensed or improperly redistributed software is not permitted.",
  },
  {
    title: "Misrepresented Goods",
    body: "Misrepresented or inaccurately described digital goods will be removed.",
  },
  {
    title: "Multi-account Abuse",
    body: "Creating multiple accounts to abuse the platform is forbidden.",
  },
  {
    title: "Price/Review Manipulation",
    body: "Artificially manipulating prices or reviews leads to suspension.",
  },
];

const accountRules: Rule[] = [
  {
    title: "Violation Consequences",
    body: "Rule violations may result in warnings, temporary bans, or permanent account termination.",
  },
  {
    title: "Balance Forfeiture",
    body: "Terminated accounts forfeit all balances. No refunds for banned accounts.",
  },
  {
    title: "Appeal Process",
    body: "Banned users may appeal via support email within 14 days of ban.",
  },
  {
    title: "Rule Updates",
    body: "We reserve the right to update these rules. Continued use means acceptance.",
  },
];

const withdrawals: Rule[] = [
  {
    title: "Seller Withdrawals",
    body: "Sellers who have earned platform credits through legitimate sales may request a withdrawal of their earned balance, subject to identity verification, minimum thresholds, and standard processing periods.",
  },
  {
    title: "Escrow Protection",
    body: "All purchase credits are held in platform escrow and released to the seller after successful delivery or after the dispute window has expired.",
  },
];

function Section({ title, badge, items }: { title: string; badge: string; items: Rule[] }) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-xl font-bold border-b-2 border-brand-blue inline-block pb-1">
          {title}
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue/10 text-brand-blue px-2 py-0.5 text-xs font-medium">
          <ShieldCheck className="h-3 w-3" /> {badge}
        </span>
      </div>
      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((r) => (
          <li key={r.title} className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold">{r.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ForSellersPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background">
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

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl bg-brand-blue text-brand-blue-foreground px-6 py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            For Sellers — Rules & Requirements
          </h1>
          <p className="mt-3 mx-auto max-w-2xl opacity-90">
            What you must comply with to maintain your store on SAMMY STORE.
          </p>
          <p className="mt-2 text-xs opacity-75">Updated: May 16, 2026</p>
        </div>

        <Section title="Seller Rules & Requirements" badge="Sellers" items={sellerRules} />
        <Section title="Prohibited Items & Activities" badge="Prohibited" items={prohibited} />
        <Section title="Wallet & Withdrawals" badge="Payouts" items={withdrawals} />
        <Section title="Account Rules & Termination" badge="Accounts" items={accountRules} />

        <div className="mt-10 rounded-xl border bg-muted/40 p-5 text-sm">
          <strong>Reminder:</strong> By selling on SAMMY STORE, you agree to abide by
          these rules. Repeated violations will lead to permanent account termination.
        </div>
      </main>

      <footer className="mt-8 border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} SAMMY STORE
        </div>
      </footer>
    </div>
  );
}
