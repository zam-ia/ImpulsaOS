import { NextRequest, NextResponse } from "next/server";
import { publishToChannel } from "@/lib/services/publish.service";
import { publishInputSchema } from "@/lib/validators/publish.schemas";

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => ({}));
  const body = publishInputSchema.parse({
    ...raw,
    scheduledAt: raw.scheduledAt ?? raw.scheduled_at,
    image_url: raw.image_url
  });
  const result = await publishToChannel(body);
  return NextResponse.json(result, { status: result.status === "failed" ? 502 : 200 });
}
