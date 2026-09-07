import { describe, it, expect } from "vitest";
import { parseItemReferences } from "@/services/scripture-reference-service";
import { bibleCanon } from "@/utils/bible-canon";
const parse = (description: string) =>
  parseItemReferences({
    title: "Scripture Reading",
    description,
    html_details: "",
    item_type: "item",
  });
describe("Scripture extraction", () => {
  it.each([
    ["1 Chronicles 29:10-13", "1Chr.29.10-1Chr.29.13"],
    ["Based on Prov. 10:12", "Prov.10.12"],
    ["1 John 4:10", "1John.4.10"],
    ["Rom. 12:3-13 - Devin Coleman", "Rom.12.3-Rom.12.13"],
    ['1 Peter 4:7-11 - "The End of All Things"', "1Pet.4.7-1Pet.4.11"],
    ["John 3:16", "John.3.16"],
    ["John 3:16-21", "John.3.16-John.3.21"],
    ["John 3", "John.3"],
    ["Psalm 23", "Ps.23"],
    ["Ps. 23:1-6", "Ps.23"],
    ["Romans 8:31–9:5", "Rom.8.31-Rom.9.5"],
    ["Romans 8:31-39", "Rom.8.31-Rom.8.39"],
  ])("extracts %s", (input, canonical) =>
    expect(parse(input).map((r) => r.canonical_reference)).toEqual([canonical]),
  );
  it("expands a multi-chapter reference once per chapter", () =>
    expect(parse("Romans 8:31–9:5")[0].chapters).toEqual([
      { book: "Rom", chapter: 8 },
      { book: "Rom", chapter: 9 },
    ]));
  it("preserves explicit verses for a full chapter", () => {
    const r = parse("Ps. 23:1-6")[0];
    expect(r.start_verse).toBe(1);
    expect(r.end_verse).toBe(6);
  });
  it("keeps chapter-only bounds unspecified", () => {
    const r = parse("John 3")[0];
    expect(r.start_verse).toBeNull();
    expect(r.end_verse).toBeNull();
  });
  it("keeps multiple references and deduplicates fields with provenance", () => {
    const refs = parseItemReferences({
      title: "John 3:16",
      description: "John 3:16; Romans 5:8",
      html_details: "<p>John 3:16</p><script>Psalm 99</script>",
      item_type: "item",
    });
    expect(refs).toHaveLength(2);
    expect(refs[0].provenance.map((p) => p.field)).toEqual([
      "title",
      "description",
      "html_details",
    ]);
  });
  it.each([
    "John 999:1",
    "John 3:99",
    "John 3:16-999",
    "John 3:0",
    "2026-09-07",
    "September 7, 2026",
    "Devin Coleman",
    "John Smith",
    "Mark Williamson",
    "3 ways to love your neighbors",
    "Announcements at 10:30",
  ])("rejects unrelated or invalid input %s", (input) =>
    expect(parse(input)).toEqual([]),
  );
  it("excludes songs", () =>
    expect(
      parseItemReferences({
        title: "Psalm 145",
        description: "John 3",
        html_details: "",
        item_type: "song",
      }),
    ).toEqual([]));
  it("defines the entire Protestant canon once", () => {
    expect(bibleCanon).toHaveLength(66);
    expect(bibleCanon.reduce((n, b) => n + b.chapters, 0)).toBe(1189);
    expect(new Set(bibleCanon.map((b) => b.id)).size).toBe(66);
  });
  it("expands a range crossing a book boundary", () => {
    expect(parse("Genesis 50:26-Exodus 1:5")[0].chapters).toEqual([
      { book: "Gen", chapter: 50 },
      { book: "Exod", chapter: 1 },
    ]);
  });
  it("retains verse bounds in an explicitly numbered continuation", () => {
    expect(parse("John 3:16 and 18")[1]).toMatchObject({
      canonical_reference: "John.3.18",
      start_verse: 18,
      end_verse: 18,
    });
  });
});
