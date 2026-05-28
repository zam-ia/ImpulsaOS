import { NextRequest, NextResponse } from "next/server";
import { runCaptureAction } from "@/lib/services/organic-capture.service";
import { captureRunInputSchema } from "@/lib/validators/automation.schemas";

export async function POST(request: NextRequest) {
  const body = captureRunInputSchema.parse(await request.json().catch(() => ({})));
  return NextResponse.json(runCaptureAction(body));
}
