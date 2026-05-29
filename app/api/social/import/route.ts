import { NextRequest, NextResponse } from "next/server";
import {
  normalizeSocialPostMetric,
  providerPlaybook,
  socialMetricFromRow,
  socialMetricToInsertRow,
  summarizeSocialMetrics
} from "@/lib/social-intelligence";
import { getFirstBusiness } from "@/lib/repositories/business.repo";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { socialImportInputSchema } from "@/lib/validators/social.schemas";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({
      ok: false,
      mode: "local",
      rows: [],
      summary: summarizeSocialMetrics([]),
      error: "Supabase no esta configurado en el servidor."
    });
  }

  const businessId = request.nextUrl.searchParams.get("businessId") ?? (await getFirstBusiness()).id;
  const { data, error } = await supabase
    .from("social_post_metrics")
    .select("*")
    .eq("business_id", businessId)
    .order("fecha_publicacion", { ascending: false })
    .limit(250);

  if (error) {
    return NextResponse.json({ ok: false, mode: "supabase", rows: [], summary: summarizeSocialMetrics([]), error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map(socialMetricFromRow);

  return NextResponse.json({
    ok: true,
    mode: "supabase",
    businessId,
    rows,
    summary: summarizeSocialMetrics(rows),
    providers: providerPlaybook
  });
}

export async function POST(req: NextRequest) {
  const parsed = socialImportInputSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const businessId =
    parsed.data.businessId === "biz_demo" || !parsed.data.businessId
      ? (await getFirstBusiness()).id
      : parsed.data.businessId;
  const rows = parsed.data.rows.map((row) => normalizeSocialPostMetric(businessId, row));
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({
      ok: true,
      mode: "local",
      rows,
      summary: summarizeSocialMetrics(rows),
      providers: providerPlaybook,
      warning: "Supabase no esta configurado; datos normalizados solo en memoria."
    });
  }

  const { data, error } = await supabase
    .from("social_post_metrics")
    .upsert(rows.map(socialMetricToInsertRow), { onConflict: "business_id,url_post" })
    .select("*");

  if (error) {
    return NextResponse.json({ ok: false, mode: "supabase", error: error.message }, { status: 500 });
  }

  const insertedRows = (data ?? []).map(socialMetricFromRow);

  return NextResponse.json({
    ok: true,
    mode: "supabase",
    businessId,
    rows: insertedRows,
    summary: summarizeSocialMetrics(insertedRows),
    providers: providerPlaybook
  });
}
