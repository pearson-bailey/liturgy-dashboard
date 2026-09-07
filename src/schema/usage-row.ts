import { z } from "zod";
export const usageRowSchema = z.object({
  item_id: z.string(),
  book: z.string(),
  chapter: z.number(),
  canonical_reference: z.string(),
  service_date: z.string(),
  element_title: z.string(),
  element_key: z.string(),
  raw_section_title: z.string().nullable(),
  liturgical_movement: z.enum([
    "pre-service",
    "god-calls",
    "god-convicts-and-cleanses",
    "god-renews",
    "god-sends",
  ]),
  service_type_id: z.string(),
  service_type_name: z.string(),
  plan_title: z.string(),
  planning_center_url: z.string().nullable(),
});
export type UsageRow = z.infer<typeof usageRowSchema>;
