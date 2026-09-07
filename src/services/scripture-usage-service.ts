import "server-only";
import {
  usagePage,
  filterOptionPage,
  serviceTypePage,
} from "@/repositories/scripture-usage-repository";
import { requireUser } from "./auth-service";
import { usageRowSchema, type UsageRow } from "@/schema/usage-row";
import type { DashboardFilters } from "@/schema/dashboard-filters";
import { bibleCanon } from "@/utils/bible-canon";
import { plainText } from "@/lib/scripture/parser";
import type {
  DashboardData,
  Occurrence,
  FilterOptions,
} from "@/types/dashboard";

export function matchesFilters(row: UsageRow, filters: DashboardFilters) {
  return (
    (!filters.from || row.service_date >= filters.from) &&
    (!filters.to || row.service_date <= filters.to) &&
    (!filters.book || row.book === filters.book) &&
    (!filters.serviceType || row.service_type_id === filters.serviceType) &&
    (!filters.movement || row.liturgical_movement === filters.movement) &&
    (!filters.element?.length || filters.element.includes(row.element_key))
  );
}
function safePlanUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      parsed.hostname === "services.planningcenteronline.com"
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}
export function occurrenceList(rows: UsageRow[]): Occurrence[] {
  const items = new Map<string, Occurrence>();
  for (const row of rows) {
    let item = items.get(row.item_id);
    if (!item) {
      item = {
        itemId: row.item_id,
        date: row.service_date,
        references: [],
        movement: row.liturgical_movement,
        element: plainText(row.element_title),
        rawHeader: row.raw_section_title
          ? plainText(row.raw_section_title)
          : null,
        serviceType: plainText(row.service_type_name),
        plan: plainText(row.plan_title),
        planUrl: safePlanUrl(row.planning_center_url),
      };
      items.set(row.item_id, item);
    }
    if (!item.references.includes(row.canonical_reference))
      item.references.push(row.canonical_reference);
  }
  return [...items.values()].sort(
    (a, b) => b.date.localeCompare(a.date) || a.itemId.localeCompare(b.itemId),
  );
}
export function aggregateUsage(
  rows: UsageRow[],
  filters: DashboardFilters,
  asOf = new Date().toISOString().slice(0, 10),
): DashboardData {
  const qualifying = rows.filter((row) => matchesFilters(row, filters));
  const chapters = new Map<string, Map<string, string>>();
  for (const row of qualifying) {
    const key = `${row.book}.${row.chapter}`;
    let items = chapters.get(key);
    if (!items) {
      items = new Map();
      chapters.set(key, items);
    }
    items.set(row.item_id, row.service_date); // One item per chapter, even with overlapping references.
  }
  const cells = bibleCanon.flatMap((book) =>
    Array.from({ length: book.chapters }, (_, i) => {
      const items = chapters.get(`${book.id}.${i + 1}`);
      const dates = [...new Set(items?.values() ?? [])].sort().reverse();
      return {
        book: book.id,
        chapter: i + 1,
        count: items?.size ?? 0,
        lastUsed: dates[0] ?? null,
        previousUsed: dates[1] ?? null,
      };
    }),
  );
  const occurrences = occurrenceList(qualifying);
  return {
    cells,
    recent: occurrences.slice(0, 50),
    occurrences: occurrences.length,
    chaptersUsed: cells.filter((c) => c.count > 0).length,
    asOf,
  };
}
async function loadUsage(filters: DashboardFilters, chapter?: number) {
  const rows: UsageRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await usagePage(filters, offset, chapter);
    rows.push(...usageRowSchema.array().parse(page));
    if (page.length < 1000) break;
  }
  return rows;
}
export async function dashboardUsage(filters: DashboardFilters) {
  await requireUser();
  return aggregateUsage(await loadUsage(filters), filters);
}
export async function chapterDetails(
  filters: DashboardFilters,
  book: string,
  chapter: number,
  offset: number,
) {
  await requireUser();
  if (filters.book && filters.book !== book)
    return { occurrences: [], total: 0 };
  const occurrences = occurrenceList(
    await loadUsage({ ...filters, book }, chapter),
  );
  return {
    occurrences: occurrences.slice(offset, offset + 50),
    total: occurrences.length,
  };
}
export async function dashboardOptions(
  dates: Pick<DashboardFilters, "from" | "to"> = {},
): Promise<FilterOptions> {
  await requireUser();
  const elements = new Map<string, string>();
  const serviceTypes: FilterOptions["serviceTypes"] = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await filterOptionPage(offset, dates);
    for (const row of page)
      if (!elements.has(row.element_key))
        elements.set(row.element_key, plainText(row.title));
    if (page.length < 1000) break;
  }
  for (let offset = 0; ; offset += 1000) {
    const page = await serviceTypePage(offset);
    serviceTypes.push(
      ...page.map((row) => ({ ...row, name: plainText(row.name) })),
    );
    if (page.length < 1000) break;
  }
  return {
    serviceTypes: serviceTypes.sort((a, b) => a.name.localeCompare(b.name)),
    elements: [...elements]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}
