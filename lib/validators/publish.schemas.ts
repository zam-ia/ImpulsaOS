import { z } from "zod";

export const publishInputSchema = z.object({
  businessId: z.string().default("biz_demo"),
  publicationId: z.string().optional(),
  channel: z.enum(["facebook_page", "instagram_business", "tiktok", "whatsapp", "facebook", "instagram_post"]).default("facebook_page"),
  mode: z.enum(["now", "schedule"]).default("now"),
  scheduledAt: z.string().optional(),
  caption: z.string().default(""),
  image_url: z.string().url().optional()
});

export type PublishInput = z.infer<typeof publishInputSchema>;
