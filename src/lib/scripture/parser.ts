import "server-only";
import { bcv_parser } from "bible-passage-reference-parser";
import * as en from "bible-passage-reference-parser/esm/lang/en.js";
import { convert } from "html-to-text";
import { z } from "zod";

export function plainText(value: string) {
  return convert(value, {
    wordwrap: false,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
    ],
  });
}
export function detectReferences(text: string) {
  const parser = new bcv_parser(en);
  parser.set_options({
    testaments: "on",
    osis_compaction_strategy: "bc",
    sequence_combination_strategy: "separate",
    book_alone_strategy: "ignore",
    book_sequence_strategy: "ignore",
    invalid_passage_strategy: "ignore",
    passage_existence_strategy: "bcv",
    end_range_digits_strategy: "verse",
  });
  const bound = z.object({
    b: z.string(),
    c: z.number(),
    v: z.number(),
    type: z.string().optional(),
  });
  const matches = z
    .array(
      z.object({
        osis: z.string(),
        type: z.string(),
        start: bound,
        end: bound,
        indices: z.tuple([z.number(), z.number()]),
        entities: z.array(
          z.object({
            valid: z.object({
              valid: z.boolean(),
              messages: z.record(z.string(), z.unknown()),
            }),
          }),
        ),
      }),
    )
    .parse(parser.parse(text.replace(/[–—]/g, "-")).parsed_entities());
  // The library can repair invalid ranges (e.g. John 3:16-999). A historical
  // analytics record must not silently substitute a different passage.
  return matches
    .filter((match) =>
      match.entities.every(
        (entity) =>
          entity.valid.valid && Object.keys(entity.valid.messages).length === 0,
      ),
    )
    .map((match) => ({
      canonical: match.osis,
      text: text.slice(match.indices[0], match.indices[1]),
      startVerse:
        (match.start.type ?? match.type).includes("v") ||
        match.osis.split("-")[0].split(".").length === 3
          ? match.start.v
          : null,
      endVerse:
        (match.end.type ?? match.type).includes("v") ||
        match.osis.split("-").at(-1)!.split(".").length === 3 ||
        (match.end.type === "integer" &&
          (match.start.type ?? match.type).includes("v"))
          ? match.end.v
          : null,
    }));
}
