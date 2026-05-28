import { z } from "zod";

export const renderInputSchema = z.object({
  businessId: z.string().default("biz_demo"),
  assetId: z.string().optional(),
  templateId: z.enum(["post_square_v1", "post_square_clean_v1", "story_v1", "carousel_v1"]).default("post_square_clean_v1"),
  format: z.enum(["1080x1080", "1080x1920"]).default("1080x1080"),
  slots: z
    .object({
      headline: z.string().default("Contenido listo"),
      subtitle: z.string().optional(),
      cta: z.string().optional(),
      photoUrl: z.string().url().optional()
    })
    .optional(),
  asset: z.unknown().optional(),
  idea: z.unknown().optional(),
  product: z.unknown().optional()
});

export type RenderInput = z.infer<typeof renderInputSchema>;
