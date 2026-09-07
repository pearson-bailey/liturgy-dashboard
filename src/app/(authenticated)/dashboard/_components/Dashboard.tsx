"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import {
  dashboardDataSchema,
  filterOptionsSchema,
  syncStatusSchema,
  chapterDetailsSchema,
  type SyncStatus,
} from "@/schema/dashboard-response";
import { fetchJson } from "@/utils/http-client";
import { bookName, bibleCanon } from "@/utils/bible-canon";
import type {
  DashboardData,
  FilterOptions,
  ChapterCell,
  Occurrence,
} from "@/types/dashboard";
import { DashboardFilters } from "./DashboardFilters";
import { ScriptureHeatmap } from "./ScriptureHeatmap";
import { RecentUsageTable } from "./RecentUsageTable";
import { SyncButton } from "./SyncButton";

export function Dashboard({ email }: { email: string }) {
  const params = useSearchParams();
  const query = params.toString();
  const mode = params.get("mode") === "recency" ? "recency" : "count";
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [options, setOptions] = useState<FilterOptions>({
    serviceTypes: [],
    elements: [],
  });
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<ChapterCell | null>(null);
  const [details, setDetails] = useState<{
    occurrences: Occurrence[];
    total: number;
  } | null>(null);
  const [detailError, setDetailError] = useState("");
  const [offset, setOffset] = useState(0);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const pending = loading || loadedQuery !== query;
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    Promise.all([
      fetchJson(
        `/api/dashboard/scripture-usage?${query}`,
        dashboardDataSchema,
        { signal: controller.signal },
      ),
      fetchJson("/api/dashboard/filters", filterOptionsSchema, {
        signal: controller.signal,
      }),
      fetchJson("/api/sync/status", syncStatusSchema, {
        signal: controller.signal,
      }),
    ])
      .then(([usage, filters, sync]) => {
        if (alive) {
          setData(usage);
          setOptions(filters);
          setStatus(sync);
          setError("");
        }
      })
      .catch((error) => {
        if (alive)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to connect. Please retry.",
          );
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
          setLoadedQuery(query);
        }
      });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [query, revision]);
  useEffect(() => {
    const timer = setInterval(() => {
      fetchJson("/api/sync/status", syncStatusSchema)
        .then(setStatus)
        .catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    let alive = true;
    const search = new URLSearchParams(query);
    search.set("selectedBook", selected.book);
    search.set("chapter", String(selected.chapter));
    search.set("offset", String(offset));
    fetchJson(
      `/api/dashboard/chapter-details?${search}`,
      chapterDetailsSchema,
      { signal: controller.signal },
    )
      .then((result) => {
        if (alive) {
          setDetails(result);
          setDetailError("");
        }
      })
      .catch((error) => {
        if (alive)
          setDetailError(
            error instanceof Error
              ? error.message
              : "Unable to load chapter details.",
          );
      });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [selected, query, offset, revision]);
  function reload() {
    setLoading(true);
    setRevision((n) => n + 1);
  }
  return (
    <>
      <header className="topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>{" "}
          Liturgy<span className="brand-subtitle">Scripture in worship</span>
        </Link>
        <div className="account">
          <span>{email}</span>
          <button
            onClick={async () => {
              try {
                await fetchJson(
                  "/api/auth/sign-out",
                  z.object({ ok: z.boolean() }),
                  { method: "POST" },
                );
                router.replace("/sign-in");
                router.refresh();
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Unable to sign out.",
                );
              }
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="dashboard">
        <section className="page-heading">
          <div>
            <p className="eyebrow">THE WORD IN OUR WORSHIP</p>
            <h1>Scripture over time</h1>
            <p className="muted">
              Trace the passages that shape our gatherings—and discover what we
              have yet to read.
            </p>
          </div>
        </section>
        <SyncButton status={status} onComplete={reload} />
        <section
          className="panel filter-panel"
          aria-label="Filter Scripture usage"
        >
          <div className="section-heading">
            <h2>Explore your services</h2>
            <span className="muted">Filters apply together</span>
          </div>
          <DashboardFilters options={options} />
        </section>
        {error && (
          <div className="notice" role="alert">
            {error} <button onClick={reload}>Retry</button>{" "}
            <Link href="/sign-in">Sign in again</Link>
          </div>
        )}
        {pending && <p role="status">Loading Scripture usage…</p>}
        {!pending && !error && data && (
          <>
            <div className="metrics">
              <div>
                <span className="metric-value">{data.occurrences}</span>
                <span>Liturgical occurrences</span>
              </div>
              <div>
                <span className="metric-value">
                  {data.chaptersUsed}
                  <small> / {data.cells.length.toLocaleString()}</small>
                </span>
                <span>Chapters touched</span>
              </div>
              <div>
                <span className="metric-value">{bibleCanon.length}</span>
                <span>Books to explore</span>
              </div>
              <p>
                One worship element counts once per chapter.
                <br />
                Songs are excluded. Every unused chapter stays visible.
              </p>
            </div>
            {!data.occurrences && (
              <p className="notice">
                {options.serviceTypes.length
                  ? "No Scripture usages match these filters. Try a broader date range or clear the filters."
                  : "No synchronized data yet. Configure Planning Center and use Sync Planning Center to import your worship plans."}
              </p>
            )}
            <section className="panel heatmap-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">THE WHOLE COUNSEL OF GOD</p>
                  <h2>Scripture coverage</h2>
                </div>
                <div className="segmented" aria-label="Heatmap mode">
                  {(["count", "recency"] as const).map((value) => (
                    <button
                      key={value}
                      aria-pressed={mode === value}
                      onClick={() => {
                        const search = new URLSearchParams(query);
                        search.set("mode", value);
                        if (value !== mode) setLoading(true);
                        window.history.pushState(
                          null,
                          "",
                          `/dashboard?${search}`,
                        );
                      }}
                    >
                      {value === "count" ? "Usage Count" : "Recency"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="legend">
                <span>
                  {mode === "count"
                    ? "Qualifying uses per chapter"
                    : "Last use within active filters"}
                </span>
                {(mode === "count"
                  ? ["Unused", "1", "2", "3–4", "5+"]
                  : [
                      "Unused",
                      "Over a year",
                      "91–365 days",
                      "31–90 days",
                      "Last 30 days",
                    ]
                ).map((label, i) => (
                  <span key={label}>
                    <i className={`heat-${i}`} />
                    {label}
                  </span>
                ))}
                <span>• marks a used chapter</span>
              </div>
              <ScriptureHeatmap
                cells={data.cells}
                mode={mode}
                asOf={data.asOf}
                onSelect={(cell) => {
                  trigger.current =
                    document.activeElement instanceof HTMLElement
                      ? document.activeElement
                      : null;
                  setSelected(cell);
                  setDetails(null);
                  setDetailError("");
                  setOffset(0);
                  dialog.current?.showModal();
                }}
              />
            </section>
            <section className="panel recent-panel">
              <div className="section-heading">
                <h2>Recent Scripture usage</h2>
                <span className="muted">
                  Newest first · up to 50 occurrences
                </span>
              </div>
              {data.recent.length ? (
                <RecentUsageTable rows={data.recent} />
              ) : (
                <p className="muted">No matching occurrences.</p>
              )}
            </section>
          </>
        )}
        <footer>
          Preserving the context of every reading, from call to worship to
          benediction.
        </footer>
      </main>
      <dialog
        ref={dialog}
        className="chapter-dialog"
        aria-labelledby="chapter-heading"
        onClose={() => trigger.current?.focus()}
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">CHAPTER HISTORY</p>
            <h2 id="chapter-heading">
              {selected
                ? `${bookName(selected.book)} ${selected.chapter}`
                : "Chapter details"}
            </h2>
          </div>
          <button
            aria-label="Close chapter details"
            onClick={() => dialog.current?.close()}
          >
            Close ×
          </button>
        </div>
        {detailError ? (
          <p role="alert">
            {detailError}{" "}
            <button onClick={() => setRevision((n) => n + 1)}>Retry</button>
          </p>
        ) : !details ? (
          <p role="status">Loading occurrences…</p>
        ) : (
          <>
            <p>
              {details.total} qualifying occurrences · current date, service,
              movement, and element filters
            </p>
            {details.occurrences.length ? (
              <RecentUsageTable rows={details.occurrences} />
            ) : (
              <p>No usage within these filters.</p>
            )}
            <div className="pagination">
              <button
                disabled={offset === 0}
                onClick={() => {
                  setDetails(null);
                  setOffset((n) => Math.max(0, n - 50));
                }}
              >
                Previous
              </button>
              <span>Page {Math.floor(offset / 50) + 1}</span>
              <button
                disabled={offset + 50 >= details.total}
                onClick={() => {
                  setDetails(null);
                  setOffset((n) => n + 50);
                }}
              >
                Next
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
