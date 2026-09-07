import "server-only";
import { createRequestClient } from "@/lib/supabase/server";
import type { DashboardFilters } from "@/schema/dashboard-filters";
import { AppError } from "@/types/errors";
export async function usagePage(
  criteria: DashboardFilters,
  offset: number,
  chapter?: number,
) {
  const client = await createRequestClient();
  let query = client
    .from("scripture_usage_rows")
    .select(
      "item_id,book,chapter,canonical_reference,service_date,element_title,element_key,raw_section_title,liturgical_movement,service_type_id,service_type_name,plan_title,planning_center_url",
    )
    .order("service_date", { ascending: false })
    .order("item_id")
    .order("scripture_reference_id")
    .order("book")
    .order("chapter");
  if (criteria.from) query = query.gte("service_date", criteria.from);
  if (criteria.to) query = query.lte("service_date", criteria.to);
  if (criteria.serviceType)
    query = query.eq("service_type_id", criteria.serviceType);
  if (criteria.movement)
    query = query.eq("liturgical_movement", criteria.movement);
  if (criteria.element?.length)
    query = query.in("element_key", criteria.element);
  if (criteria.book) query = query.eq("book", criteria.book);
  if (chapter) query = query.eq("chapter", chapter);
  const { data, error } = await query.range(offset, offset + 999);
  if (error)
    throw new AppError(
      500,
      "Unable to load Scripture usage. Check that database migrations have been applied.",
    );
  return data;
}
export async function filterOptionPage(
  offset: number,
  dates: Pick<DashboardFilters, "from" | "to"> = {},
) {
  const client = await createRequestClient();
  let query = client
    .from("planning_center_plan_items")
    .select("title,element_key,planning_center_plans!inner(service_date)")
    .neq("item_type", "header")
    .order("id");
  if (dates.from)
    query = query.gte("planning_center_plans.service_date", dates.from);
  if (dates.to)
    query = query.lte("planning_center_plans.service_date", dates.to);
  const { data, error } = await query.range(offset, offset + 999);
  if (error) throw new AppError(500, "Unable to load liturgical elements.");
  return data;
}
export async function serviceTypePage(offset: number) {
  const client = await createRequestClient();
  const { data, error } = await client
    .from("planning_center_service_types")
    .select("id,name")
    .order("id")
    .range(offset, offset + 999);
  if (error) throw new AppError(500, "Unable to load Service Types.");
  return data;
}
