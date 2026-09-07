import "server-only";
import { detectReferences, plainText } from "@/lib/scripture/parser";
import { bibleCanon } from "@/utils/bible-canon";
import type { Reference, SourceItem } from "@/types/scripture";

export function parseItemReferences(
  item: Pick<
    SourceItem,
    "title" | "description" | "html_details" | "item_type"
  >,
): Reference[] {
  if (item.item_type === "song" || item.item_type === "header") return [];
  const results = new Map<string, Reference>();
  for (const field of ["title", "description", "html_details"] as const) {
    const text = plainText(item[field]);
    for (const found of detectReferences(text))
      for (const canonical of found.canonical.split(",")) {
        const [start, end = start] = canonical.split("-");
        const [startBook, sc] = start.split(".");
        const [endBook, ec] = end.split(".");
        const startIndex = bibleCanon.findIndex((b) => b.id === startBook);
        const endIndex = bibleCanon.findIndex((b) => b.id === endBook);
        if (startIndex < 0 || endIndex < startIndex || !sc || !ec) continue;
        const existing = results.get(canonical);
        if (existing) {
          if (
            !existing.provenance.some(
              (p) => p.field === field && p.text === found.text,
            )
          )
            existing.provenance.push({ field, text: found.text });
          continue;
        }
        const chapters: Reference["chapters"] = [];
        for (let i = startIndex; i <= endIndex; i++) {
          const book = bibleCanon[i];
          const first = i === startIndex ? Number(sc) : 1;
          const last = i === endIndex ? Number(ec) : book.chapters;
          for (let chapter = first; chapter <= last; chapter++)
            chapters.push({ book: book.id, chapter });
        }
        results.set(canonical, {
          canonical_reference: canonical,
          raw_reference: found.text,
          source_field: field,
          provenance: [{ field, text: found.text }],
          start_book: startBook,
          start_chapter: Number(sc),
          start_verse: found.startVerse,
          end_book: endBook,
          end_chapter: Number(ec),
          end_verse: found.endVerse,
          chapters,
        });
      }
  }
  return [...results.values()];
}
