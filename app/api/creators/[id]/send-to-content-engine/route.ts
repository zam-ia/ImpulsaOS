import { NextRequest, NextResponse } from "next/server";
import { sendCreatorInsightsToEngine } from "@/lib/creator-radar";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const result = await sendCreatorInsightsToEngine(params.id, body.goalId ?? null);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
