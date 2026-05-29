import { z } from "zod";

export const videoAspectSchema = z.enum(["9:16", "16:9", "1:1"]);
export const videoSourceSchema = z.enum(["pexels", "pixabay", "local", "manual"]);

export const createVideoInputSchema = z.object({
  businessId: z.string().default("biz_demo"),
  assetId: z.string().optional(),
  subject: z.string().min(3),
  script: z.string().default(""),
  searchTerms: z.array(z.string()).default([]),
  aspect: videoAspectSchema.default("9:16"),
  source: videoSourceSchema.default("pexels"),
  voiceName: z.string().default("es-PE-CamilaNeural-Female"),
  voiceRate: z.coerce.number().min(0.5).max(2).default(1),
  voiceVolume: z.coerce.number().min(0).max(2).default(1),
  bgmType: z.enum(["random", "none", "custom"]).default("random"),
  bgmVolume: z.coerce.number().min(0).max(1).default(0.2),
  subtitleEnabled: z.boolean().default(true),
  subtitlePosition: z.enum(["top", "center", "bottom", "custom"]).default("bottom"),
  fontSize: z.coerce.number().min(24).max(120).default(60),
  clipDuration: z.coerce.number().min(2).max(12).default(5),
  videoCount: z.coerce.number().min(1).max(5).default(1),
  materialUrls: z.array(z.string()).default([])
});

export const taskIdSchema = z.string().min(3);

export type CreateVideoInput = z.infer<typeof createVideoInputSchema>;
