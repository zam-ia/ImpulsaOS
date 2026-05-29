import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

function score(input: { likes?: number; comments?: number; shares?: number; saves?: number; views?: number }) {
  return Math.round((input.likes ?? 0) + (input.comments ?? 0) * 3 + (input.shares ?? 0) * 4 + (input.saves ?? 0) * 5 + (input.views ?? 0) * 0.01);
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase no configurado" }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  if (!body.creatorId || !body.postUrl) {
    return NextResponse.json({ ok: false, error: "creatorId y postUrl son requeridos" }, { status: 400 });
  }
  const { data: creator } = await supabase.from("creators").select("business_id").eq("id", body.creatorId).single();
  if (!creator) return NextResponse.json({ ok: false, error: "Creador no encontrado" }, { status: 404 });

  const row = {
    creator_id: body.creatorId,
    account_id: body.accountId ?? null,
    business_id: creator.business_id,
    platform: body.platform ?? "instagram",
    post_url: body.postUrl,
    post_type: body.postType ?? "manual",
    published_at: body.publishedAt ?? new Date().toISOString(),
    caption: body.caption ?? "",
    hook: body.hook ?? "",
    hook_type: body.hookType ?? null,
    topic: body.topic ?? "",
    format: body.format ?? "",
    cta: body.cta ?? "",
    intention: body.intention ?? null,
    likes: Number(body.likes ?? 0),
    comments: Number(body.comments ?? 0),
    shares: Number(body.shares ?? 0),
    saves: Number(body.saves ?? 0),
    views: Number(body.views ?? 0),
    hashtags: body.hashtags ?? [],
    thumbnail_url: body.thumbnailUrl ?? null,
    duration_seconds: Number(body.durationSeconds ?? 0),
    performance_score: score(body)
  };

  const { data, error } = await supabase.from("creator_posts").upsert(row, { onConflict: "creator_id,post_url" }).select("*").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, post: data });
}
