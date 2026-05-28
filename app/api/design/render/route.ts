import { NextRequest, NextResponse } from "next/server";
import { renderDesign } from "@/lib/services/design.service";
import { renderInputSchema } from "@/lib/validators/design.schemas";

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => ({}));
  const body = renderInputSchema.parse({
    ...raw,
    templateId: raw.templateId ?? raw.template_id ?? "post_square_clean_v1"
  });
  const result = renderDesign(body);

  return new NextResponse(result.svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "X-Storage-Path": result.storagePath,
      "Cache-Control": "no-store"
    }
  });
}
