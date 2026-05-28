import { NextResponse } from "next/server";

export async function GET() {
  const facebookReady = Boolean(process.env.META_PAGE_ID && process.env.META_PAGE_ACCESS_TOKEN);
  const instagramReady = Boolean(process.env.META_IG_USER_ID && process.env.META_PAGE_ACCESS_TOKEN);
  const tiktokReady = Boolean(process.env.TIKTOK_ACCESS_TOKEN);
  const whatsappReady = Boolean(process.env.WHATSAPP_PHONE);

  return NextResponse.json({
    channels: {
      facebook: {
        ready: facebookReady,
        mode: facebookReady ? "api" : "manual",
        required: ["META_PAGE_ID", "META_PAGE_ACCESS_TOKEN"]
      },
      instagram: {
        ready: instagramReady,
        mode: instagramReady ? "api" : "manual",
        required: ["META_IG_USER_ID", "META_PAGE_ACCESS_TOKEN"]
      },
      tiktok: {
        ready: tiktokReady,
        mode: tiktokReady ? "api_pending_adapter" : "manual",
        required: ["TIKTOK_ACCESS_TOKEN"]
      },
      whatsapp: {
        ready: whatsappReady,
        mode: "handoff",
        required: ["WHATSAPP_PHONE"]
      }
    }
  });
}
