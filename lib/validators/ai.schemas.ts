import { z } from "zod";

export const generateInputSchema = z.object({
  businessId: z.string().default("biz_demo"),
  promptType: z.enum(["weekly_plan", "content-plan", "copy", "script", "visual_prompt"]).default("weekly_plan"),
  objective: z.enum(["viralidad", "valor", "autoridad", "prueba_social", "venta", "comunidad"]).optional(),
  productId: z.string().optional(),
  channel: z.enum(["facebook", "instagram_feed", "instagram_post", "instagram_reel", "instagram_story", "tiktok", "whatsapp"]).optional(),
  count: z.number().int().min(1).max(14).optional(),
  workspace: z.unknown().optional()
});

export type GenerateInput = z.infer<typeof generateInputSchema>;
