import { NextRequest, NextResponse } from "next/server";
import { startCreatorAnalysis } from "@/lib/creator-radar";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const result = await startCreatorAnalysis(params.id, body.goalId ?? null);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
