import { NextRequest, NextResponse } from "next/server";
import { runWeeklyAutomation } from "@/lib/services/automation.service";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    job: "weekly",
    ...(await runWeeklyAutomation()),
    executed_at: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
