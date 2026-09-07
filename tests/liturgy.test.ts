import { describe, it, expect } from "vitest";
import {
  classifyItems,
  normalizeElement,
} from "@/services/liturgical-structure-service";
import type { SourceItem } from "@/types/scripture";
const source = (titles: [SourceItem["item_type"], string][]): SourceItem[] =>
  titles.map(([item_type, title], sequence) => ({
    item_type,
    title,
    sequence,
    planning_center_id: String(sequence),
    description: "",
    html_details: "",
    service_position: null,
    planning_center_updated_at: null,
  }));
describe("liturgical classification", () => {
  it("propagates ordered headers through songs and preserves raw text", () => {
    const items = classifyItems(
      source([
        ["item", "Announcements"],
        ["header", " GOD calls his people to worship from all nations! "],
        ["item", "Call to Worship"],
        ["song", "Psalm 145"],
        ["item", "Invocation"],
        ["header", "God convicts his people and cleanses them of their sin."],
        ["item", "Confession"],
        ["item", "Assurance"],
        [
          "header",
          "<p>God renews and sets his people apart by His Word and Spirit</p>",
        ],
        ["item", "Scripture Reading"],
        ["item", "Sermon"],
        ["header", "God Sends"],
        ["item", "Benediction"],
      ]).reverse(),
    );
    expect(items.map((i) => i.liturgical_movement)).toEqual([
      "pre-service",
      ...Array(4).fill("god-calls"),
      ...Array(3).fill("god-convicts-and-cleanses"),
      ...Array(3).fill("god-renews"),
      ...Array(2).fill("god-sends"),
    ]);
    expect(items[2].raw_section_title).toBe(
      " GOD calls his people to worship from all nations! ",
    );
    expect(items.map((i) => i.sequence)).toEqual(
      Array.from({ length: 13 }, (_, i) => i),
    );
  });
  it("preserves unknown headers and handles consecutive headers", () => {
    const rows = classifyItems(
      source([
        ["header", "Custom welcome"],
        ["item", "Announcements"],
        ["header", "God Calls"],
        ["header", "Mission update"],
        ["item", "Reading"],
        ["header", "God Sends"],
        ["header", "God Renews"],
        ["item", "Sermon"],
      ]),
    );
    expect(rows[1].liturgical_movement).toBe("pre-service");
    expect(rows[4].raw_section_title).toBe("Mission update");
    expect(rows[4].liturgical_movement).toBe("god-calls");
    expect(rows[7].liturgical_movement).toBe("god-renews");
  });
  it("normalizes trivial variations without merging different elements", () => {
    expect(
      new Set(
        [
          "Call to Worship",
          "call to worship",
          "Call   to Worship",
          "Call to Worship:",
        ].map(normalizeElement),
      ).size,
    ).toBe(1);
    expect(normalizeElement("Sermon")).not.toBe(
      normalizeElement("Scripture Reading"),
    );
  });
});
