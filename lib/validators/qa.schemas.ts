import { z } from "zod";

export const qaInputSchema = z.object({
  businessId: z.string().default("biz_demo"),
  productId: z.string().optional(),
  assetId: z.string().optional(),
  content: z.object({
    title: z.string().optional(),
    body: z.string().default(""),
    cta: z.string().optional(),
    claimedPrice: z.number().nullable().optional()
  })
});

export type QaInput = z.infer<typeof qaInputSchema>;
