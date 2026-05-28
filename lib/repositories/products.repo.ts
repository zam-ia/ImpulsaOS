import { initialWorkspace } from "@/lib/seed";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getActiveProducts() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return initialWorkspace.products.filter((product) => product.status === "active");

  const { data } = await supabase.from("products").select("*").eq("status", "active");
  return data?.length ? data : initialWorkspace.products.filter((product) => product.status === "active");
}
