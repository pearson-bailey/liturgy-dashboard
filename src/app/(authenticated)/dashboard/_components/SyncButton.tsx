"use client";
import { useState } from "react";
import { z } from "zod";
import { fetchJson } from "@/utils/http-client";
import type { SyncStatus } from "@/schema/dashboard-response";
export function SyncButton({
  status,
  onComplete,
}: {
  status: SyncStatus | null;
  onComplete: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const active = status?.running;
  async function run(kind: "planning-center" | "reparse") {
    setBusy(true);
    setMessage(
      kind === "reparse"
        ? "Reparsing stored source items…"
        : "Synchronizing Planning Center. This may take several minutes…",
    );
    try {
      const result = await fetchJson(
        `/api/sync/${kind}`,
        z.object({
          plans_processed: z.number(),
          scripture_references_found: z.number(),
        }),
        { method: "POST" },
      );
      setMessage(
        `Completed: ${result.plans_processed} plans and ${result.scripture_references_found} Scripture references.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect. Please retry.",
      );
    } finally {
      setBusy(false);
      onComplete();
    }
  }
  return (
    <div className="sync-panel">
      {status?.startDate && (
        <p className="muted">
          Import range: {status.startDate} through {status.endDate}.
        </p>
      )}
      <div className="sync-actions">
        <button
          className="primary"
          disabled={busy || active || Boolean(status?.configurationMessage)}
          onClick={() => run("planning-center")}
        >
          {busy || active ? "Sync running…" : "↻ Sync Planning Center"}
        </button>
        <button disabled={busy || active} onClick={() => run("reparse")}>
          Reparse stored items
        </button>
      </div>
      <p role="status" aria-live="polite">
        {message ||
          (status?.lastSuccessful
            ? `Last successful sync: ${new Date(status.lastSuccessful).toLocaleString()}`
            : "No successful synchronization yet.")}
      </p>
      {status?.latest?.status === "failed" && (
        <p className="notice" role="alert">
          Latest run failed: {status.latest.error_message}
        </p>
      )}
      {status?.configurationMessage && (
        <p className="muted">
          {status.configurationMessage} Seeded data and reparsing remain
          available.
        </p>
      )}
    </div>
  );
}
