import { z } from "zod";

export const botReplyInputSchema = z.object({
  campaignId: z.string().default("capture_weekly_demo"),
  incomingMessage: z.string().min(1),
  useApi: z.boolean().optional(),
  leadName: z.string().optional()
});

export const captureRunInputSchema = z.object({
  campaignId: z.string().default("capture_weekly_demo"),
  action: z.enum(["generate_content", "simulate_day", "run_bot_check"]).default("simulate_day")
});

export type BotReplyInput = z.infer<typeof botReplyInputSchema>;
export type CaptureRunInput = z.infer<typeof captureRunInputSchema>;
