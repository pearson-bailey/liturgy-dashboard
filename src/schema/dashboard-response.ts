import { z } from "zod";
export const occurrenceSchema = z.object({
  itemId: z.string(),
  date: z.string(),
  references: z.array(z.string()),
  movement: z.enum([
    "pre-service",
    "god-calls",
    "god-convicts-and-cleanses",
    "god-renews",
    "god-sends",
  ]),
  element: z.string(),
  rawHeader: z.string().nullable(),
  serviceType: z.string(),
  plan: z.string(),
  planUrl: z.string().nullable(),
});
export const dashboardDataSchema = z.object({
  cells: z.array(
    z.object({
      book: z.string(),
      chapter: z.number(),
      count: z.number(),
      lastUsed: z.string().nullable(),
      previousUsed: z.string().nullable(),
    }),
  ),
  recent: z.array(occurrenceSchema),
  occurrences: z.number(),
  chaptersUsed: z.number(),
  asOf: z.string(),
});
export const filterOptionsSchema = z.object({
  serviceTypes: z.array(z.object({ id: z.string(), name: z.string() })),
  elements: z.array(z.object({ key: z.string(), label: z.string() })),
});
export const chapterDetailsSchema = z.object({
  occurrences: z.array(occurrenceSchema),
  total: z.number(),
});
export const syncStatusSchema = z.object({
  running: z.boolean(),
  lastSuccessful: z.string().nullable(),
  configurationMessage: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string(),
  latest: z
    .object({
      id: z.string(),
      status: z.enum(["running", "completed", "failed"]),
      kind: z.string(),
      heartbeat_at: z.string(),
      error_message: z.string().nullable(),
      plans_processed: z.number(),
      items_processed: z.number(),
      scripture_references_found: z.number(),
    })
    .nullable(),
});
export type SyncStatus = z.infer<typeof syncStatusSchema>;
