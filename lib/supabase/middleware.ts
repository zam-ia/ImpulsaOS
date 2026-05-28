import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function supabaseMiddleware(_request: NextRequest) {
  return NextResponse.next();
}
