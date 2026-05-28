import { NextRequest, NextResponse } from "next/server";
import { approveAsset } from "@/lib/repositories/assets.repo";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const assetId = body?.assetId as string | undefined;

  if (!assetId) {
    return NextResponse.json({ ok: false, error: "assetId requerido" }, { status: 400 });
  }

  const result = await approveAsset(assetId);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
