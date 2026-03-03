import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  bio: z.string().max(240).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  isPrivate: z.boolean().optional()
});
