import "server-only";
import { z } from "zod";
import { AppError } from "@/types/errors";
const configSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(1),
});
export function getSupabaseConfig() {
  const result = configSchema.safeParse({
    url: process.env.SUPABASE_URL,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  });
  if (!result.success)
    throw new AppError(
      503,
      "Authentication is not configured. Contact your administrator.",
    );
  return result.data;
}
export function getSecretKey() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key)
    throw new AppError(
      503,
      "Synchronization storage is not configured. Ask your administrator to complete server setup.",
    );
  return key;
}
