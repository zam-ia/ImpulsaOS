import { NextRequest, NextResponse } from "next/server";
import { generateMarketingContent } from "@/lib/services/ai.service";
import { generateInputSchema } from "@/lib/validators/ai.schemas";

async function callGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  if (!apiKey) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      })
    }
  );

  if (!response.ok) return null;
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => ({}));
  const body = generateInputSchema.parse({
    ...raw,
    promptType: raw.promptType ?? raw.prompt_type ?? "weekly_plan",
    productId: raw.productId ?? raw.product_id,
    businessId: raw.businessId ?? raw.business_id ?? "biz_demo"
  });

  const gemini = await callGemini(
    `Genera JSON valido para ${body.promptType}. Business: ${body.businessId}. Producto: ${body.productId ?? "auto"}. Objetivo: ${body.objective ?? "auto"}. Canal: ${body.channel ?? "auto"}. Usa solo datos proporcionados.`
  );

  if (gemini) {
    return NextResponse.json({
      provider: "gemini",
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      result: gemini
    });
  }

  return NextResponse.json(await generateMarketingContent({ ...body, workspace: raw.workspace }));
}
