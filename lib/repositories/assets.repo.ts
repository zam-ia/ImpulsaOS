import type { ContentAsset } from "@/lib/types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function insertContentAsset(asset: Partial<ContentAsset> & { businessId?: string }) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { data: { id: asset.id }, error: null };

  return supabase.from("content_assets").insert({
    business_id: asset.businessId,
    idea_id: asset.ideaId,
    product_id: asset.productId,
    asset_type: asset.assetType === "design" ? "image" : asset.assetType,
    channel: asset.channel,
    title: asset.title,
    body: asset.copy,
    cta: asset.copy?.match(/(Escr[ií]beme|Responde|Comenta|Agenda|Guarda).*/i)?.[0] ?? null,
    prompt: asset.prompt,
    qa_score: asset.qa?.score,
    qa_status: asset.qa?.needsReview ? "needs_review" : "approved",
    status: asset.status,
    risk_flags: asset.qa?.riskFlags ?? [],
    metadata: {
      designTemplateId: asset.designTemplateId,
      targetConnectionIds: asset.targetConnectionIds ?? [],
      referenceImageUrls: asset.referenceImageUrls ?? [],
      videoConfig: asset.videoConfig ?? null,
      videoTask: asset.videoTask ?? null
    }
  });
}

export async function approveAsset(assetId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: true, mode: "demo" };

  const { error } = await supabase.from("content_assets").update({ status: "approved", qa_status: "approved" }).eq("id", assetId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, mode: "supabase" };
}
