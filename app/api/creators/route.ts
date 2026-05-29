import { NextRequest, NextResponse } from "next/server";
import { createCreator, listCreators } from "@/lib/creator-radar";

export async function GET() {
  const result = await listCreators();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const result = await createCreator(body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
