import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin-page";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { LogManager, type Product } from "@/components/log-manager";

export const Route = createFileRoute("/admin/product-logins")({ component: AdminLogins });

function AdminLogins() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("products").select("id,name,stock").order("name").then(({ data }) => {
      setProducts((data as Product[]) ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <AdminPage
      title="Product Logs"
      description="Each log = 1 unit of stock. Stock updates automatically. Logs are delivered automatically on purchase."
    >
      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <LogManager products={products} />
      )}
    </AdminPage>
  );
}
