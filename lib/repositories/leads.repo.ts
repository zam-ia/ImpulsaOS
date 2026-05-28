import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function insertLeadEvent(input: {
  businessId: string;
  leadId?: string | null;
  eventType: string;
  metadata: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: true, mode: "demo" };

  const { error } = await supabase.from("lead_events").insert({
    business_id: input.businessId,
    lead_id: input.leadId ?? null,
    event_type: input.eventType,
    metadata: input.metadata
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, mode: "supabase" };
}
