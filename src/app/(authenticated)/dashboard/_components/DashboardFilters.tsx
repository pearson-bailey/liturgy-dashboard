"use client";
import { useSearchParams } from "next/navigation";
import type { FilterOptions } from "@/types/dashboard";
import { bibleCanon } from "@/utils/bible-canon";
import { movements } from "@/utils/liturgical-movements";
import { ElementFilter } from "./ElementFilter";
import { useEffect, useState } from "react";
import { fetchJson } from "@/utils/http-client";
import { filterOptionsSchema } from "@/schema/dashboard-response";
export function DashboardFilters({ options }: { options: FilterOptions }) {
  const params = useSearchParams();
  return (
    <FilterForm
      key={params.toString()}
      options={options}
      queryString={params.toString()}
    />
  );
}
function FilterForm({
  options,
  queryString,
}: {
  options: FilterOptions;
  queryString: string;
}) {
  const params = new URLSearchParams(queryString);
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const dateQuery = new URLSearchParams();
  if (from) dateQuery.set("from", from);
  if (to) dateQuery.set("to", to);
  const range = dateQuery.toString();
  const [result, setResult] = useState<{
    range: string;
    elements: FilterOptions["elements"];
    error: string;
  } | null>(null);
  const invalidRange = Boolean(from && to && from > to);
  const loading = !invalidRange && result?.range !== range;
  const error = invalidRange
    ? "From must be on or before Through."
    : result?.range === range
      ? result.error
      : "";
  useEffect(() => {
    if (invalidRange) return;
    const controller = new AbortController();
    fetchJson(`/api/dashboard/filters?${range}`, filterOptionsSchema, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ range, elements: data.elements, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({
            range,
            elements: [],
            error:
              error instanceof Error
                ? error.message
                : "Unable to load elements.",
          });
      });
    return () => controller.abort();
  }, [range, invalidRange]);
  return (
    <form
      className="filter-grid"
      onSubmit={(event) => {
        event.preventDefault();
        if (loading || error) return;
        const values = new FormData(event.currentTarget);
        const query = new URLSearchParams();
        for (const [key, value] of values)
          if (String(value)) query.append(key, String(value));
        query.set(
          "mode",
          params.get("mode") === "recency" ? "recency" : "count",
        );
        window.history.pushState(null, "", `/dashboard?${query}`);
      }}
    >
      <label>
        From
        <input
          type="date"
          name="from"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
      </label>
      <label>
        Through
        <input
          type="date"
          name="to"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </label>
      <label>
        Service Type
        <select
          name="serviceType"
          defaultValue={params.get("serviceType") ?? ""}
        >
          <option value="">All Service Types</option>
          {options.serviceTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Liturgical movement
        <select name="movement" defaultValue={params.get("movement") ?? ""}>
          <option value="">All Movements</option>
          {Object.entries(movements).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <ElementFilter
        options={result?.elements ?? []}
        initialSelection={params.getAll("element")}
        disabled={loading || Boolean(error)}
        message={
          loading
            ? "Loading elements for these dates…"
            : error ||
              (result?.elements.length === 0
                ? "No elements occurred within these dates."
                : "")
        }
      />
      <label>
        Bible book
        <select name="book" defaultValue={params.get("book") ?? ""}>
          <option value="">All Books</option>
          {bibleCanon.map((book) => (
            <option key={book.id} value={book.id}>
              {book.name}
            </option>
          ))}
        </select>
      </label>
      <div className="filter-actions">
        <button className="primary" disabled={loading || Boolean(error)}>
          Apply filters
        </button>
        <button
          type="button"
          onClick={() => window.history.pushState(null, "", "/dashboard")}
        >
          Clear
        </button>
      </div>
    </form>
  );
}
