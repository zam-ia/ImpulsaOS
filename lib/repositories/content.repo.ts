import type { ContentIdea } from "@/lib/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function insertContentIdea(idea: Partial<ContentIdea>) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { data: { id: idea.id }, error: null };

  return supabase
    .from("content_ideas")
    .insert({
      business_id: idea.businessId,
      product_id: idea.productId,
      title: idea.title,
      angle: idea.angle,
      hook: idea.hook,
      format: idea.format,
      objective: idea.objective,
      viral_score: idea.viralScore,
      status: idea.status
    })
    .select("id")
    .single();
}
