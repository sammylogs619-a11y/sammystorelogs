import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin-page";
import { Users, Package, Wallet, ArrowLeftRight } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const stats = [
  { label: "Total Users", value: "0", icon: Users },
  { label: "Products", value: "0", icon: Package },
  { label: "Wallet Balance", value: "$0.00", icon: Wallet },
  { label: "Transactions", value: "0", icon: ArrowLeftRight },
];

function AdminDashboard() {
  return (
    <AdminPage title="Dashboard" description="Overview of your store activity.">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {s.label}
              </span>
              <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Recent Activity</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No activity yet. Activity will appear here as users interact with the store.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Sales Overview</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect products and start receiving orders to see sales trends.
          </p>
        </div>
      </div>
    </AdminPage>
  );
}
