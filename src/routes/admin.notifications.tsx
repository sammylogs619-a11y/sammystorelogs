import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin-page";
import { Bell, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/notifications")({
  component: () => (
    <AdminPage
      title="Notifications"
      description="Send announcements to users and view activity."
      actions={
        <button className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> New notification
        </button>
      }
    >
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="Broadcast updates, promos or alerts to all users from here."
      />
    </AdminPage>
  ),
});
