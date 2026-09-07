import type { Movement } from "@/utils/liturgical-movements";
export type SourceItem = {
  planning_center_id: string;
  title: string;
  description: string;
  html_details: string;
  item_type: "item" | "header" | "song" | "media";
  sequence: number;
  service_position: string | null;
  planning_center_updated_at: string | null;
};
export type Reference = {
  canonical_reference: string;
  raw_reference: string;
  source_field: string;
  provenance: { field: string; text: string }[];
  start_book: string;
  start_chapter: number;
  start_verse: number | null;
  end_book: string;
  end_chapter: number;
  end_verse: number | null;
  chapters: { book: string; chapter: number }[];
};
export type ClassifiedItem = SourceItem & {
  raw_section_title: string | null;
  liturgical_movement: Movement;
  element_key: string;
};
export type ParsedItem = ClassifiedItem & { references: Reference[] };
