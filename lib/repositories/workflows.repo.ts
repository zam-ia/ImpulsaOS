import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function insertAutomationRun(input: {
  businessId: string;
  flowId: string;
  status: "queued" | "running" | "success" | "failed" | "cancelled";
  context?: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: true, mode: "demo" };

  const { error } = await supabase.from("automation_runs").insert({
    business_id: input.businessId,
    flow_id: input.flowId,
    status: input.status,
    context: input.context ?? {}
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, mode: "supabase" };
}
