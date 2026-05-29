import { NextResponse } from "next/server";
import { startBulkAnalysis } from "@/lib/creator-radar";

export async function POST() {
  const result = await startBulkAnalysis();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
