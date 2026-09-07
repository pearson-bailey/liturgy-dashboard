import { describe, it, expect } from "vitest";
import { aggregateUsage } from "@/services/scripture-usage-service";
import type { UsageRow } from "@/schema/usage-row";
import {
  dashboardFiltersSchema,
  parseDashboardFilters,
} from "@/schema/dashboard-filters";
import { heatLevel } from "@/app/(authenticated)/dashboard/_utils/heatmap.utils";
const row = (values: Partial<UsageRow>): UsageRow => ({
  item_id: "a",
  book: "Rom",
  chapter: 8,
  canonical_reference: "Rom.8.1",
  service_date: "2026-09-06",
  element_title: "Scripture Reading",
  element_key: "scripture-reading",
  raw_section_title: "God Renews",
  liturgical_movement: "god-renews",
  service_type_id: "11111111-1111-4111-8111-111111111111",
  service_type_name: "Morning",
  plan_title: "Sunday",
  planning_center_url: null,
  ...values,
});
const rows = [
  row({}),
  row({ canonical_reference: "Rom.8.2" }),
  row({
    item_id: "b",
    element_title: "Sermon",
    element_key: "sermon",
    service_date: "2026-08-30",
  }),
  row({
    item_id: "c",
    book: "Ps",
    chapter: 23,
    canonical_reference: "Ps.23",
    liturgical_movement: "god-calls",
    service_date: "2025-01-01",
    service_type_id: "22222222-2222-4222-8222-222222222222",
  }),
];
describe("dashboard service", () => {
  it.each([
    [{ element: ["sermon", "scripture-reading"] }, 3],
    [{ element: ["sermon", "missing"] }, 1],
    [{ element: ["sermon", "scripture-reading"], movement: "god-calls" }, 1],
    [{ element: [] }, 3],
    [{ from: "2026-01-01", movement: "god-renews" }, 2],
    [{ from: "2026-01-01", element: "sermon" }, 1],
    [{ book: "Rom", to: "2026-08-31" }, 1],
    [
      {
        serviceType: "22222222-2222-4222-8222-222222222222",
        movement: "god-calls",
      },
      1,
    ],
    [{ movement: "god-renews", element: "sermon" }, 1],
    [{ movement: "god-calls", element: "sermon" }, 0],
  ])("combines %j", (filters, count) =>
    expect(
      aggregateUsage(rows, dashboardFiltersSchema.parse(filters)).occurrences,
    ).toBe(count),
  );
  it("counts item-chapter occurrences without inflating duplicate joins", () => {
    const data = aggregateUsage([...rows, ...rows], { mode: "count" });
    expect(data.occurrences).toBe(3);
    expect(
      data.cells.find((c) => c.book === "Rom" && c.chapter === 8),
    ).toMatchObject({
      count: 2,
      lastUsed: "2026-09-06",
      previousUsed: "2026-08-30",
    });
    expect(data.cells).toHaveLength(1189);
    expect(data.recent[0].references).toHaveLength(2);
  });
  it("preserves zero-use chapters and recency buckets", () => {
    const data = aggregateUsage(rows, { mode: "recency" }, "2026-09-07");
    expect(data.cells[0].count).toBe(0);
    expect(heatLevel(data.cells[0], "recency", data.asOf)).toBe(0);
    expect(
      heatLevel(
        data.cells.find((c) => c.book === "Rom" && c.chapter === 8)!,
        "recency",
        data.asOf,
      ),
    ).toBe(4);
    expect(
      heatLevel(
        data.cells.find((c) => c.book === "Ps" && c.chapter === 23)!,
        "recency",
        data.asOf,
      ),
    ).toBe(1);
  });
  it("rejects invalid combined filters", () => {
    expect(
      parseDashboardFilters(
        new URLSearchParams("element=sermon&element=scripture-reading"),
      ).element,
    ).toEqual(["sermon", "scripture-reading"]);
    expect(
      parseDashboardFilters(new URLSearchParams("element=sermon")).element,
    ).toEqual(["sermon"]);
    expect(() =>
      parseDashboardFilters(new URLSearchParams("element=sermon&element=")),
    ).toThrow();
    expect(
      dashboardFiltersSchema.safeParse({ from: "2026-09-07", to: "2026-01-01" })
        .success,
    ).toBe(false);
    expect(dashboardFiltersSchema.safeParse({ book: "Tob" }).success).toBe(
      false,
    );
  });
});
