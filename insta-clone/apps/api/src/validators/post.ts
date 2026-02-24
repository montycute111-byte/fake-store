import { z } from "zod";

export const createPostSchema = z.object({
  caption: z.string().min(1).max(2200),
  mediaUrl: z.string().url(),
  mediaType: z.literal("IMAGE")
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(500),
  parentId: z.string().optional()
});
