import { NextRequest, NextResponse } from "next/server";
import { suggestBotReply } from "@/lib/services/organic-capture.service";
import { botReplyInputSchema } from "@/lib/validators/automation.schemas";

export async function POST(request: NextRequest) {
  const parsed = botReplyInputSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "incomingMessage requerido", issues: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(await suggestBotReply(parsed.data));
}
