import "server-only";
import { plainText } from "@/lib/scripture/parser";
import type { ClassifiedItem, SourceItem } from "@/types/scripture";
import type { Movement } from "@/utils/liturgical-movements";

export function normalizeElement(title: string) {
  return plainText(title)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .replace(/\s+/g, "-");
}
const headerKeys: Record<string, Movement> = {};
for (const [movement, variants] of [
  [
    "god-calls",
    ["God Calls", "God calls his people to worship from all nations"],
  ],
  [
    "god-convicts-and-cleanses",
    [
      "God Convicts & Cleanses",
      "God convicts his people and cleanses them of their sin",
    ],
  ],
  [
    "god-renews",
    [
      "God Renews",
      "God renews and sets his people apart by His Word and Spirit",
    ],
  ],
  [
    "god-sends",
    [
      "God Sends",
      "God sends his people with his blessing to make disciples of all nations",
    ],
  ],
] satisfies [Movement, string[]][])
  for (const variant of variants)
    headerKeys[normalizeElement(variant)] = movement;

export function classifyItems(items: SourceItem[]): ClassifiedItem[] {
  let movement: Movement = "pre-service";
  let raw: string | null = null;
  return [...items]
    .sort(
      (a, b) =>
        a.sequence - b.sequence ||
        a.planning_center_id.localeCompare(b.planning_center_id),
    )
    .map((item) => {
      if (item.item_type === "header") {
        raw = item.title;
        movement = headerKeys[normalizeElement(item.title)] ?? movement;
      }
      return {
        ...item,
        raw_section_title: raw,
        liturgical_movement: movement,
        element_key: normalizeElement(item.title),
      };
    });
}
