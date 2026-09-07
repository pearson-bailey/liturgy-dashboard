import type { ChapterCell } from "@/types/dashboard";
export function heatLevel(
  cell: ChapterCell,
  mode: "count" | "recency",
  asOf: string,
) {
  if (!cell.count) return 0;
  if (mode === "count")
    return cell.count >= 5 ? 4 : cell.count >= 3 ? 3 : cell.count >= 2 ? 2 : 1;
  const days =
    (Date.parse(asOf) - Date.parse(cell.lastUsed ?? asOf)) / 86400000;
  return days <= 30 ? 4 : days <= 90 ? 3 : days <= 365 ? 2 : 1;
}
