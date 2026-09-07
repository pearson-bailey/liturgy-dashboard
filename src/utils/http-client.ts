import { z } from "zod";
import { AppError } from "@/types/errors";
export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(body);
    throw new AppError(
      response.status,
      error.success ? error.data.error : "The request failed. Please retry.",
    );
  }
  return schema.parse(body);
}
