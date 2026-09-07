import { z } from "zod";
export const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});
export const emailSchema = z.object({ email: z.email() });
export const passwordSchema = z.object({
  password: z.string().min(12).max(128),
});
