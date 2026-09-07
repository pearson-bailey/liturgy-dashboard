"use client";
import { useState } from "react";
import type { FilterOptions } from "@/types/dashboard";

export function ElementFilter({
  options,
  initialSelection,
  disabled = false,
  message = "",
}: {
  options: FilterOptions["elements"];
  initialSelection: string[];
  disabled?: boolean;
  message?: string;
}) {
  const [selected, setSelected] = useState(initialSelection);
  const visibleSelection = selected.filter((key) =>
    options.some((option) => option.key === key),
  );
  return (
    <fieldset className="element-filter" disabled={disabled}>
      <legend>Liturgical element</legend>
      {message && (
        <p role="status" className="muted">
          {message}
        </p>
      )}
      <details>
        <summary>
          {visibleSelection.length
            ? `${visibleSelection.length} selected`
            : "All Elements"}
        </summary>
        <div className="element-options">
          <p>Select elements to include. No selection includes all elements.</p>
          <button type="button" onClick={() => setSelected([])}>
            All elements
          </button>
          {options.map((element) => (
            <label key={element.key}>
              <input
                type="checkbox"
                name="element"
                value={element.key}
                checked={selected.includes(element.key)}
                onChange={(event) =>
                  setSelected(
                    event.target.checked
                      ? [...selected, element.key]
                      : selected.filter((key) => key !== element.key),
                  )
                }
              />
              {element.label}
            </label>
          ))}
        </div>
      </details>
    </fieldset>
  );
}
