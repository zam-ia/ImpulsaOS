import { NextRequest, NextResponse } from "next/server";
import { evaluateAsset } from "@/lib/qa";
import { runQa } from "@/lib/services/qa.service";
import { qaInputSchema } from "@/lib/validators/qa.schemas";

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => ({}));
  if (raw.content) {
    return NextResponse.json(runQa(qaInputSchema.parse(raw)));
  }

  const qa = evaluateAsset({
    copy: raw.copy ?? "",
    hook: raw.hook,
    cta: raw.cta,
    product: raw.product as Parameters<typeof evaluateAsset>[0]["product"],
    priceText: raw.priceText,
    brand: raw.brand as Parameters<typeof evaluateAsset>[0]["brand"]
  });

  return NextResponse.json({ qa });
}
