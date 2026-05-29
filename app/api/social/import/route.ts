import { NextRequest, NextResponse } from "next/server";
import { normalizeSocialPostMetric, providerPlaybook, summarizeSocialMetrics } from "@/lib/social-intelligence";
import { socialImportInputSchema } from "@/lib/validators/social.schemas";

export async function POST(req: NextRequest) {
  const parsed = socialImportInputSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const rows = parsed.data.rows.map((row) => normalizeSocialPostMetric(parsed.data.businessId, row));

  return NextResponse.json({
    ok: true,
    rows,
    summary: summarizeSocialMetrics(rows),
    providers: providerPlaybook
  });
}
