import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
import { AppError } from "@/types/errors";
export type PlanRow =
  Database["public"]["Tables"]["planning_center_plans"]["Row"];
export async function replacePlan(
  runId: string,
  serviceType: Json,
  plan: Json,
  items: Json,
) {
  const { data, error } = await createAdminClient().rpc("replace_plan", {
    p_run: runId,
    p_service_type: serviceType,
    p_plan: plan,
    p_items: items,
  });
  if (error)
    throw new AppError(
      error.code === "55P03" ? 409 : 500,
      error.code === "55P03"
        ? "The synchronization lease was lost. Please retry."
        : "Unable to persist a synchronized plan.",
    );
  return data;
}
export async function storedPlans(offset: number) {
  const { data, error } = await createAdminClient()
    .from("planning_center_plans")
    .select("*")
    .order("id")
    .range(offset, offset + 499);
  if (error) throw new AppError(500, "Unable to read stored plans.");
  return data;
}
export async function storedItems(planId: string, offset: number) {
  const { data, error } = await createAdminClient()
    .from("planning_center_plan_items")
    .select("*")
    .eq("plan_id", planId)
    .order("sequence")
    .order("id")
    .range(offset, offset + 499);
  if (error) throw new AppError(500, "Unable to read stored items.");
  return data;
}
export async function storedServiceType(id: string) {
  const { data, error } = await createAdminClient()
    .from("planning_center_service_types")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new AppError(500, "Unable to read stored Service Type.");
  return data;
}
