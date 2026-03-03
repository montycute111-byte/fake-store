import { z } from "zod";

export const startConversationSchema = z.object({
  participantId: z.string().min(1)
});

export const createMessageSchema = z.object({
  body: z.string().max(2000).optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["IMAGE", "VIDEO"]).optional()
}).refine((v) => v.body || v.mediaUrl, { message: "Either body or mediaUrl is required" });
