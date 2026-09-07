import "server-only";
import { z } from "zod";
import { AppError } from "@/types/errors";
const nullableText = z
  .string()
  .nullish()
  .transform((v) => v ?? null);
const timestamp = z.iso
  .datetime({ offset: true })
  .nullish()
  .transform((v) => v ?? null);
export const serviceTypeSchema = z.object({
  id: z.string().regex(/^\d+$/),
  attributes: z.object({
    name: z.string(),
    archived_at: timestamp,
    updated_at: timestamp,
  }),
});
export const planSchema = z.object({
  id: z.string().regex(/^\d+$/),
  attributes: z.object({
    title: nullableText,
    series_title: nullableText,
    dates: nullableText,
    sort_date: z.iso.datetime({ offset: true }),
    service_time_count: z.number().int().nonnegative(),
    updated_at: timestamp,
    planning_center_url: nullableText,
  }),
});
export const itemSchema = z.object({
  id: z.string().regex(/^\d+$/),
  attributes: z.object({
    title: z.string(),
    description: nullableText,
    html_details: nullableText,
    item_type: z.enum(["item", "song", "header", "media"]),
    sequence: z.number().int(),
    service_position: nullableText,
    updated_at: timestamp,
  }),
});
const configSchema = z.object({
  clientId: z.string().min(1),
  secret: z.string().min(1),
  userAgent: z.string().min(5),
  startDate: z.iso.date(),
  serviceTypeIds: z.array(z.string().regex(/^\d+$/)),
});
export function planningCenterConfig() {
  const result = configSchema.safeParse({
    clientId: process.env.PLANNING_CENTER_CLIENT_ID,
    secret: process.env.PLANNING_CENTER_SECRET,
    userAgent: process.env.PLANNING_CENTER_USER_AGENT,
    startDate: process.env.PLANNING_CENTER_SYNC_START_DATE,
    serviceTypeIds: (process.env.PLANNING_CENTER_SERVICE_TYPE_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });
  if (!result.success)
    throw new AppError(
      503,
      "Planning Center is not configured. Ask your administrator to set the server credentials, identifying User-Agent, and historical start date.",
    );
  if (result.data.startDate > new Date().toISOString().slice(0, 10))
    throw new AppError(
      503,
      "The configured synchronization start date is in the future.",
    );
  return result.data;
}
type Config = ReturnType<typeof planningCenterConfig>;
const base = "https://api.planningcenteronline.com/services/v2/";
export class PlanningCenterClient {
  constructor(
    private config: Config,
    private request: typeof fetch = fetch,
    private sleep: (ms: number) => Promise<void> = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms)),
  ) {}
  async *pages<T>(
    path: string,
    schema: z.ZodType<T>,
    heartbeat: () => Promise<void> = async () => {},
  ): AsyncGenerator<T[]> {
    let next: string | null = new URL(path, base).href;
    const seen = new Set<string>();
    while (next) {
      const url = new URL(next, base);
      if (
        url.origin !== new URL(base).origin ||
        !url.pathname.startsWith("/services/v2/") ||
        url.username ||
        url.password
      )
        throw new AppError(
          502,
          "Planning Center returned an invalid pagination link.",
        );
      if (seen.has(url.href) || seen.size >= 10000)
        throw new AppError(
          502,
          "Planning Center pagination did not terminate.",
        );
      seen.add(url.href);
      let response: Response | undefined;
      for (let attempt = 0; attempt < 4; attempt++) {
        await heartbeat();
        try {
          response = await this.request(url, {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.secret}`).toString("base64")}`,
              "User-Agent": this.config.userAgent,
              "X-PCO-API-Version": "2018-11-01",
              Accept: "application/json",
            },
            cache: "no-store",
            redirect: "error",
            signal: AbortSignal.timeout(30000),
          });
        } catch {
          throw new AppError(
            502,
            "Planning Center could not be reached. Please retry.",
          );
        }
        if (response.status !== 429 && response.status < 500) break;
        if (attempt === 3)
          throw new AppError(
            502,
            "Planning Center is busy or rate limited. Please retry later.",
          );
        const retry = response.headers.get("Retry-After");
        const wait = retry
          ? /^\d+(\.\d+)?$/.test(retry)
            ? Number(retry) * 1000
            : Date.parse(retry) - Date.now()
          : 1000 * 2 ** attempt;
        if (!Number.isFinite(wait) || wait > 120000)
          throw new AppError(
            502,
            "Planning Center requested a longer retry delay. Please try again later.",
          );
        await this.sleep(Math.max(0, wait));
      }
      if (!response?.ok)
        throw new AppError(
          502,
          `Planning Center rejected the request (HTTP ${response?.status ?? 502}). Check server access and retry.`,
        );
      const parsed = z
        .object({
          data: z.array(schema),
          links: z
            .object({ next: z.string().nullable().optional() })
            .optional(),
        })
        .safeParse(await response.json());
      if (!parsed.success)
        throw new AppError(
          502,
          "Planning Center returned an unexpected response format.",
        );
      await heartbeat();
      yield parsed.data.data;
      next = parsed.data.links?.next ?? null;
      if (next) await this.sleep(150);
    }
  }
}
