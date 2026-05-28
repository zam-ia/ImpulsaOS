import { NextRequest, NextResponse } from "next/server";
import { trackWhatsappClick } from "@/lib/services/leads.service";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const campaign = search.get("campaign") ?? "unknown";
  const product = search.get("product") ?? "unknown";
  const channel = search.get("channel") ?? "unknown";
  const phone = search.get("phone") ?? process.env.WHATSAPP_PHONE ?? "";
  const text = search.get("text") ?? "Hola, quiero información.";
  const businessId = search.get("business_id");
  const redirectUrl = await trackWhatsappClick({
    businessId: businessId ?? undefined,
    campaign,
    product,
    channel,
    phone,
    text
  });

  return NextResponse.redirect(redirectUrl, { status: 302 });
}
