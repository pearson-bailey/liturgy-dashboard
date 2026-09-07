import type { Movement } from "@/utils/liturgical-movements";
export type ChapterCell = {
  book: string;
  chapter: number;
  count: number;
  lastUsed: string | null;
  previousUsed: string | null;
};
export type Occurrence = {
  itemId: string;
  date: string;
  references: string[];
  movement: Movement;
  element: string;
  rawHeader: string | null;
  serviceType: string;
  plan: string;
  planUrl: string | null;
};
export type DashboardData = {
  cells: ChapterCell[];
  recent: Occurrence[];
  occurrences: number;
  chaptersUsed: number;
  asOf: string;
};
export type FilterOptions = {
  serviceTypes: { id: string; name: string }[];
  elements: { key: string; label: string }[];
};
