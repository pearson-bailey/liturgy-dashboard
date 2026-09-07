import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { loadEnvFile } from "node:process";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { prepareItems } from "@/services/planning-center-sync-service";
import { databaseFetch } from "@/lib/supabase/database-fetch";
loadEnvFile(".env.local");
const url = process.env.SUPABASE_URL!;
if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname))
  throw Error("Database tests require isolated local Supabase.");
const admin = createClient<Database>(url, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});
const user = createClient<Database>(
  url,
  process.env.SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false }, global: { fetch: databaseFetch } },
);
const anon = createClient<Database>(
  url,
  process.env.SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false } },
);
let userId = "";
const runs: string[] = [];
const st = { planning_center_id: "integration-type", name: "Integration Test" };
const plan = {
  planning_center_id: "integration-plan",
  title: "Integration Plan",
  service_date: "2026-09-06",
};
const items = (description: string) =>
  prepareItems([
    {
      planning_center_id: "integration-item",
      title: "Scripture Reading",
      description,
      html_details: "",
      item_type: "item",
      sequence: 1,
      service_position: null,
      planning_center_updated_at: null,
    },
  ]);
beforeAll(async () => {
  const result = await user.auth.signInWithPassword({
    email: "elder@example.test",
    password: "Local-elders-2026!",
  });
  expect(result.error).toBeNull();
  userId = result.data.user!.id;
});
afterAll(async () => {
  await admin
    .from("planning_center_plans")
    .delete()
    .eq("planning_center_id", plan.planning_center_id);
  await admin
    .from("planning_center_service_types")
    .delete()
    .eq("planning_center_id", st.planning_center_id);
  if (runs.length) await admin.from("sync_runs").delete().in("id", runs);
  await user.auth.signOut();
});
describe("local database contract", () => {
  it("allows invited reads and denies anonymous reads and authenticated writes", async () => {
    expect(
      (await user.from("planning_center_plans").select("id")).data?.length,
    ).toBeGreaterThan(0);
    expect(
      (await anon.from("planning_center_plans").select("id")).error,
    ).not.toBeNull();
    expect(
      (await anon.from("scripture_usage_rows").select("*")).error,
    ).not.toBeNull();
    expect(
      (await user.from("planning_center_service_types").insert(st)).error,
    ).not.toBeNull();
    expect(
      (
        await user.rpc("acquire_sync", {
          p_user: userId,
          p_start: "2020-01-01",
          p_end: "2026-09-07",
          p_kind: "sync",
        })
      ).error,
    ).not.toBeNull();
    const signup = await anon.auth.signUp({
      email: "public-signup@example.test",
      password: "Disabled-signup-2026!",
    });
    expect(signup.error).not.toBeNull();
  });
  it("serializes concurrent lock acquisition and replaces snapshots atomically", async () => {
    const acquired = await Promise.all(
      [1, 2].map(() =>
        admin.rpc("acquire_sync", {
          p_user: userId,
          p_start: "2020-01-01",
          p_end: "2026-09-07",
          p_kind: "sync",
        }),
      ),
    );
    expect(acquired.filter((r) => !r.error)).toHaveLength(1);
    const run = acquired.find((r) => !r.error)!.data!;
    runs.push(run);
    for (let i = 0; i < 2; i++)
      expect(
        (
          await admin.rpc("replace_plan", {
            p_run: run,
            p_service_type: st,
            p_plan: plan,
            p_items: items("John 3:16"),
          })
        ).error,
      ).toBeNull();
    const stored = await admin
      .from("planning_center_plan_items")
      .select("id")
      .eq("planning_center_id", "integration-item")
      .single();
    expect(
      (
        await admin
          .from("scripture_references")
          .select("*")
          .eq("plan_item_id", stored.data!.id)
      ).data,
    ).toHaveLength(1);
    expect(
      (
        await admin.rpc("replace_plan", {
          p_run: run,
          p_service_type: st,
          p_plan: plan,
          p_items: items("Romans 8:31–9:5"),
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await admin
          .from("scripture_references")
          .select("canonical_reference")
          .eq("plan_item_id", stored.data!.id)
      ).data,
    ).toEqual([{ canonical_reference: "Rom.8.31-Rom.9.5" }]);
    const usages = await admin
      .from("scripture_usage_rows")
      .select("book,chapter")
      .eq("item_id", stored.data!.id);
    expect(usages.data).toHaveLength(2);
    const broken = items("Psalm 23").map((item) => ({
      ...item,
      item_type: "invalid",
    }));
    expect(
      (
        await admin.rpc("replace_plan", {
          p_run: run,
          p_service_type: st,
          p_plan: plan,
          p_items: broken,
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await admin
          .from("scripture_usage_rows")
          .select("book")
          .eq("item_id", stored.data!.id)
      ).data?.map((r) => r.book),
    ).toEqual(["Rom", "Rom"]);
    expect(
      (
        await admin.rpc("replace_plan", {
          p_run: run,
          p_service_type: st,
          p_plan: plan,
          p_items: [],
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await admin
          .from("scripture_usage_rows")
          .select("item_id")
          .eq("item_id", stored.data!.id)
      ).data,
    ).toEqual([]);
    await admin
      .from("sync_runs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", run);
  });
  it("recovers stale leases and fences an old worker", async () => {
    const first = await admin.rpc("acquire_sync", {
      p_user: userId,
      p_start: "2020-01-01",
      p_end: "2026-09-07",
      p_kind: "sync",
    });
    runs.push(first.data!);
    await admin
      .from("sync_runs")
      .update({ heartbeat_at: "2000-01-01T00:00:00Z" })
      .eq("id", first.data!);
    const second = await admin.rpc("acquire_sync", {
      p_user: userId,
      p_start: "2020-01-01",
      p_end: "2026-09-07",
      p_kind: "reparse",
    });
    expect(second.error).toBeNull();
    runs.push(second.data!);
    expect(
      (
        await admin.rpc("replace_plan", {
          p_run: first.data!,
          p_service_type: st,
          p_plan: plan,
          p_items: [],
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await admin
          .from("sync_runs")
          .select("status")
          .eq("id", first.data!)
          .single()
      ).data?.status,
    ).toBe("failed");
    await admin
      .from("sync_runs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", second.data!);
  });
});
