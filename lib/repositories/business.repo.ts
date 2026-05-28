import { initialWorkspace } from "@/lib/seed";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getFirstBusiness() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return initialWorkspace.business;

  const { data } = await supabase.from("businesses").select("*").limit(1).maybeSingle();
  return data ?? initialWorkspace.business;
}
