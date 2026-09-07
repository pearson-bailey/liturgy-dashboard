import { bookName } from "@/utils/bible-canon";

// Presentation of our normalized OSIS contract; reference extraction stays server-side.
export function displayReference(canonical: string) {
  const [start, end] = canonical.split("-");
  const [book, chapter, verse] = start.split(".");
  const first = `${bookName(book)} ${chapter}${verse ? `:${verse}` : ""}`;
  if (!end) return first;
  const [lastBook, lastChapter, lastVerse] = end.split(".");
  if (lastBook !== book)
    return `${first}–${bookName(lastBook)} ${lastChapter}${lastVerse ? `:${lastVerse}` : ""}`;
  if (lastChapter === chapter && verse && lastVerse)
    return `${first}–${lastVerse}`;
  return `${first}–${lastChapter}${lastVerse ? `:${lastVerse}` : ""}`;
}
