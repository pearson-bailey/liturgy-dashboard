import { z } from "zod";
import { movements } from "@/utils/liturgical-movements";
import { bibleCanon } from "@/utils/bible-canon";
export const dashboardFiltersSchema = z
  .object({
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    serviceType: z.uuid().optional(),
    movement: z
      .enum(
        Object.keys(movements) as [
          keyof typeof movements,
          ...(keyof typeof movements)[],
        ],
      )
      .optional(),
    element: z
      .union([
        z
          .string()
          .min(1)
          .max(300)
          .transform((value) => [value]),
        z.array(z.string().min(1).max(300)),
      ])
      .optional(),
    book: z
      .string()
      .refine((id) => bibleCanon.some((b) => b.id === id))
      .optional(),
    mode: z.enum(["count", "recency"]).default("count"),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Start date must be on or before end date.",
  });
export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;
export function parseDashboardFilters(params: URLSearchParams) {
  return dashboardFiltersSchema.parse({
    ...Object.fromEntries(params),
    element: params.getAll("element"),
  });
}
export const chapterQuerySchema = z
  .object({
    selectedBook: z
      .string()
      .refine((id) => bibleCanon.some((b) => b.id === id)),
    chapter: z.coerce.number().int().positive(),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .refine(
    (v) =>
      v.chapter <=
      (bibleCanon.find((b) => b.id === v.selectedBook)?.chapters ?? 0),
  );
