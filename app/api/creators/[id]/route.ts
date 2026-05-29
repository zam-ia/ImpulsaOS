import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type RouteContext = {
  params: {
    id: string;
  };
};

const selectFullCreator = "*, creator_accounts(*), analysis_runs(*), creator_posts(*), content_patterns(*), adaptable_ideas(*)";

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase no configurado" }, { status: 500 });

  const { data, error } = await supabase.from("creators").select(selectFullCreator).eq("id", params.id).single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 404 });

  return NextResponse.json({ ok: true, creator: data });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase no configurado" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const allowed = [
    "name",
    "type",
    "niche",
    "country",
    "audience",
    "relevance_level",
    "notes",
    "status",
    "winning_format",
    "dominant_hook",
    "opportunity_score"
  ];
  const patch = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));

  const { data, error } = await supabase
    .from("creators")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select(selectFullCreator)
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, creator: data });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase no configurado" }, { status: 500 });

  const { error } = await supabase.from("creators").delete().eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
