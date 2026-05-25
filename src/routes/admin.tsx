import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Search, Bell, Loader2 } from "lucide-react";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useIsAdmin } from "@/hooks/use-is-admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Sammy Store" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, loading, user } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/30 px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have permission to view this area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur px-3 md:px-4">
            <SidebarTrigger className="shrink-0" />
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search…"
                className="w-full rounded-md border bg-muted/40 pl-9 pr-3 py-2 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="button"
              className="relative grid h-9 w-9 place-items-center rounded-md hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
          </header>
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
