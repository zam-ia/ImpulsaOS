import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createBrowserSupabase() {
  return createSupabaseBrowserClient();
}

export function createServerSupabase() {
  return createSupabaseAdminClient();
}
