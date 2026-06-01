import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { LogManager, type Product } from "@/components/log-manager";

export const Route = createFileRoute("/seller/product-logins")({ component: Page });

function Page() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("products").select("id,name,stock").eq("seller_id", user.id).order("name").then(({ data }) => {
      setProducts((data as Product[]) ?? []);
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Product Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage logs for your products. Stock updates automatically; logs deliver to buyers on purchase.
        </p>
      </div>
      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <LogManager products={products} />
      )}
    </div>
  );
}
