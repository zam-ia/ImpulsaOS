import { NextRequest, NextResponse } from "next/server";
import { createMoneyPrinterVideo } from "@/lib/moneyprinter";
import { createVideoInputSchema } from "@/lib/validators/video.schemas";

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => ({}));
  const input = createVideoInputSchema.parse(raw);
  const result = await createMoneyPrinterVideo(input);

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    settings: result.settings,
    task: result.task,
    moneyPrinterPayload: result.payload
  });
}
