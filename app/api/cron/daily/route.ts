import { NextRequest, NextResponse } from "next/server";

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
    status: "ok",
    job: "daily",
    actions: [
      "Revisar piezas needs_review",
      "Detectar publicaciones programadas para hoy",
      "Alertar leads con interés alto",
      "Generar checklist manual si faltan tokens Meta"
    ],
    executed_at: new Date().toISOString()
  });
}
