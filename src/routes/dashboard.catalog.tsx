import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/dashboard/catalog")({
  component: () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Catalog</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse all categories of digital services.</p>
      </div>
      <Link to="/categories" className="block rounded-2xl border bg-card p-6 hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50">
            <Layers className="h-6 w-6 text-brand-blue" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Open full catalog</p>
            <p className="text-sm text-muted-foreground">View all categories and products</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
    </div>
  ),
});
