import "server-only";
import { createAdminClient, createRequestClient } from "@/lib/supabase/server";
import { AppError } from "@/types/errors";
import type { Database } from "@/types/database";
export async function acquireRun(
  user: string,
  start: string,
  end: string,
  kind: "sync" | "reparse",
) {
  const { data, error } = await createAdminClient().rpc("acquire_sync", {
    p_user: user,
    p_start: start,
    p_end: end,
    p_kind: kind,
  });
  if (error)
    throw new AppError(
      error.code === "55P03" ? 409 : 500,
      error.code === "55P03"
        ? "A synchronization or reparse is already running."
        : "Unable to start synchronization. Check database setup.",
    );
  return data;
}
export async function updateRun(
  id: string,
  values: Database["public"]["Tables"]["sync_runs"]["Update"],
) {
  const { data, error } = await createAdminClient()
    .from("sync_runs")
    .update({ ...values, heartbeat_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "running")
    .select("id")
    .single();
  if (error || !data)
    throw new AppError(409, "The synchronization lease was lost.");
}
export async function readSyncStatus() {
  const client = await createRequestClient();
  const [latest, success] = await Promise.all([
    client
      .from("sync_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("sync_runs")
      .select("completed_at")
      .eq("status", "completed")
      .eq("kind", "sync")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (latest.error || success.error)
    throw new AppError(500, "Unable to read synchronization status.");
  return {
    latest: latest.data,
    lastSuccessful: success.data?.completed_at ?? null,
  };
}
