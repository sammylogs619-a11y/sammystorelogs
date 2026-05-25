import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/for-buyers")({
  head: () => ({
    meta: [
      { title: "For Buyers — SAMMY STORE Rules & Guidelines" },
      {
        name: "description",
        content:
          "Buyer rules and guidelines for SAMMY STORE: product verification, payments, downloads, communication, refunds, disputes, and wallet policy.",
      },
      { property: "og:title", content: "For Buyers — SAMMY STORE" },
      {
        property: "og:description",
        content:
          "Everything buyers need to know before purchasing on SAMMY STORE.",
      },
    ],
  }),
  component: ForBuyersPage,
});

type Rule = { title: string; body: string };

const buyerRules: Rule[] = [
  {
    title: "Product Verification",
    body: "Verify product details before purchase. Read descriptions, seller rules, and reviews carefully.",
  },
  {
    title: "Payment Authorization",
    body: "You authorize payment for purchased items. Ensure you have sufficient balance before purchasing.",
  },
  {
    title: "Account Download",
    body: "Download purchased accounts immediately. We're not responsible for accounts lost due to delayed downloads.",
  },
  {
    title: "Seller Communication",
    body: "Communicate respectfully with sellers. Sellers have 24 hours to respond to messages.",
  },
  {
    title: "Refund Policy",
    body: "Refunds are only available through our dispute system. No refunds for downloaded accounts unless invalid.",
  },
];

const purchaseRules: Rule[] = [
  {
    title: "Secure Transactions",
    body: "All transactions are secured by our escrow system. Funds are released only after delivery.",
  },
  {
    title: "No Returns",
    body: "Digital accounts cannot be returned once downloaded. Test accounts before purchase when possible.",
  },
  {
    title: "Transaction History",
    body: "Keep records of all transactions. Download receipts and save order details.",
  },
  {
    title: "No Chargebacks",
    body: "Unauthorized chargebacks result in permanent ban. Use dispute system instead.",
  },
];

const disputeSteps: Rule[] = [
  {
    title: "Direct Communication First",
    body: "Attempt to resolve issues directly with the seller before opening a dispute.",
  },
  {
    title: "Dispute Time Limit",
    body: "Disputes must be opened within 7 days of purchase. No disputes accepted after this period.",
  },
  {
    title: "Evidence Required",
    body: "Provide screenshots, messages, and proof when opening a dispute.",
  },
  {
    title: "Admin Decision",
    body: "Admin decisions are final. Both parties must comply with resolution.",
  },
  {
    title: "Escalation",
    body: "You can invite an admin to join the dispute chat if parties cannot agree.",
  },
];

const walletRules: Rule[] = [
  {
    title: "Virtual Platform Credits",
    body: "All deposited funds are converted into virtual platform credits (\"Balance\") used exclusively to purchase digital services within the SAMMY STORE marketplace. Platform credits are not a form of currency or electronic money.",
  },
  {
    title: "Non-Refundable for Buyers",
    body: "Once deposited, platform credits cannot be withdrawn or refunded to buyers. Credits are intended solely for purchasing digital services available on the platform.",
  },
  {
    title: "Escrow Protection",
    body: "All purchase credits are held in a platform escrow and only released to the seller after successful delivery or after the dispute window has expired. In the event of a valid dispute, credits are returned to the buyer's platform balance.",
  },
  {
    title: "Acceptance of Policy",
    body: "By adding funds to your platform wallet, you expressly acknowledge that the deposited amount is converted to non-withdrawable virtual credits for use within this platform only.",
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

function ForBuyersPage() {
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
            For Buyers — Rules & Guidelines
          </h1>
          <p className="mt-3 mx-auto max-w-2xl opacity-90">
            Everything you need to know before purchasing on SAMMY STORE.
          </p>
          <p className="mt-2 text-xs opacity-75">Updated: May 16, 2026</p>
        </div>

        <Section title="Buyer Rules & Guidelines" badge="Buyers" items={buyerRules} />
        <Section title="Purchase & Transaction Rules" badge="Transactions" items={purchaseRules} />
        <Section title="Dispute Resolution Process" badge="Disputes" items={disputeSteps} />
        <Section title="Platform Credits & Wallet Policy" badge="All Users" items={walletRules} />

        <div className="mt-10 rounded-xl border bg-muted/40 p-5 text-sm">
          <strong>Important:</strong> All sales are final. Ensure you understand what
          you're purchasing before completing the transaction. By using SAMMY STORE,
          you agree to abide by these rules and terms of service.
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
