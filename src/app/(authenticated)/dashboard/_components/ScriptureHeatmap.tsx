"use client";
import { useState } from "react";
import { bibleCanon, bookName } from "@/utils/bible-canon";
import type { ChapterCell } from "@/types/dashboard";
import { heatLevel } from "../_utils/heatmap.utils";
export function ScriptureHeatmap({
  cells,
  mode,
  asOf,
  onSelect,
}: {
  cells: ChapterCell[];
  mode: "count" | "recency";
  asOf: string;
  onSelect: (cell: ChapterCell) => void;
}) {
  const [focused, setFocused] = useState<ChapterCell | null>(null);
  const lookup = new Map(
    cells.map((cell) => [`${cell.book}.${cell.chapter}`, cell]),
  );
  return (
    <>
      <div className="heatmap-help" aria-live="polite">
        {focused
          ? `${bookName(focused.book)} ${focused.chapter} · ${focused.count} usages · Last used: ${focused.lastUsed ?? "Never within these filters"}${focused.previousUsed ? ` · Previous: ${focused.previousUsed}` : ""}`
          : "Focus or hover over a chapter for its count and dates. Select it to explore the services behind it."}
      </div>
      {["OT", "NT"].map((testament) => (
        <section
          key={testament}
          className="testament"
          aria-label={testament === "OT" ? "Old Testament" : "New Testament"}
        >
          <h3>
            {testament === "OT" ? "Old Testament" : "New Testament"}{" "}
            <span>{`${bibleCanon.filter((book) => book.testament === testament).length} books`}</span>
          </h3>
          {bibleCanon
            .filter((book) => book.testament === testament)
            .map((book) => (
              <div className="book-row" key={book.id}>
                <h4>{book.name}</h4>
                <div className="chapter-grid">
                  {Array.from({ length: book.chapters }, (_, i) => {
                    const cell = lookup.get(`${book.id}.${i + 1}`) ?? {
                      book: book.id,
                      chapter: i + 1,
                      count: 0,
                      lastUsed: null,
                      previousUsed: null,
                    };
                    const label = `${book.name} ${i + 1}: ${cell.count} usages; last used ${cell.lastUsed ?? "never within these filters"}${cell.previousUsed ? `; previous ${cell.previousUsed}` : ""}`;
                    return (
                      <button
                        key={i}
                        className={`chapter heat-${heatLevel(cell, mode, asOf)}`}
                        aria-label={label}
                        title={label}
                        onFocus={() => setFocused(cell)}
                        onMouseEnter={() => {
                          if (
                            !document.activeElement?.classList.contains(
                              "chapter",
                            )
                          )
                            setFocused(cell);
                        }}
                        onClick={() => onSelect(cell)}
                      >
                        <span>{i + 1}</span>
                        {cell.count > 0 && (
                          <span className="used-dot" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </section>
      ))}
    </>
  );
}
