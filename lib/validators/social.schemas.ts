import { z } from "zod";

export const socialPlatformSchema = z.enum(["facebook", "instagram", "tiktok", "whatsapp"]);
export const socialDataProviderSchema = z.enum([
  "meta_business_sdk",
  "tiktok_business_sdk",
  "instaloader",
  "tiktok_api",
  "facebook_scraper",
  "crawlee",
  "manual_csv",
  "ocr",
  "whisper"
]);

export const socialPostMetricInputSchema = z.object({
  competitorProfileId: z.string().nullable().default(null),
  redSocial: socialPlatformSchema,
  cuenta: z.string().min(1),
  urlPost: z.string().min(1),
  fechaPublicacion: z.string().min(1),
  tipoContenido: z.string().min(1),
  duracionVideo: z.coerce.number().min(0).default(0),
  likes: z.coerce.number().min(0).default(0),
  comentarios: z.coerce.number().min(0).default(0),
  shares: z.coerce.number().min(0).default(0),
  views: z.coerce.number().min(0).default(0),
  hookTextual: z.string().default(""),
  hookVerbal: z.string().default(""),
  hookVisual: z.string().default(""),
  tema: z.string().default(""),
  provider: socialDataProviderSchema.default("manual_csv"),
  raw: z.record(z.unknown()).default({})
});

export const socialImportInputSchema = z.object({
  businessId: z.string().default("biz_demo"),
  rows: z.array(socialPostMetricInputSchema).min(1).max(200)
});

export type SocialImportInput = z.infer<typeof socialImportInputSchema>;
