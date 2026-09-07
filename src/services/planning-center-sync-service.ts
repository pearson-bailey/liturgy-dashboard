import "server-only";
import {
  PlanningCenterClient,
  planningCenterConfig,
  serviceTypeSchema,
  planSchema,
  itemSchema,
} from "@/lib/planning-center/planning-center-client";
import {
  replacePlan,
  storedPlans,
  storedItems,
  storedServiceType,
} from "@/repositories/planning-center-data-repository";
import {
  acquireRun,
  updateRun,
  readSyncStatus,
} from "@/repositories/sync-runs-repository";
import { requireUser } from "./auth-service";
import { classifyItems } from "./liturgical-structure-service";
import { parseItemReferences } from "./scripture-reference-service";
import type { SourceItem } from "@/types/scripture";
import { AppError } from "@/types/errors";
import { z } from "zod";

export function prepareItems(items: SourceItem[]) {
  return classifyItems(items)
    .filter((item) => item.item_type !== "song")
    .map((item) => ({ ...item, references: parseItemReferences(item) }));
}
export async function syncStatus() {
  await requireUser();
  const status = await readSyncStatus();
  let configurationMessage: string | null = null;
  let startDate: string | null = null;
  try {
    startDate = planningCenterConfig().startDate;
  } catch (error) {
    configurationMessage =
      error instanceof AppError
        ? error.message
        : "Planning Center is not configured.";
  }
  return {
    ...status,
    configurationMessage,
    startDate,
    endDate: new Date().toISOString().slice(0, 10),
    running:
      status.latest?.status === "running" &&
      Date.now() - Date.parse(status.latest.heartbeat_at) < 600000,
  };
}
export async function synchronizePlanningCenter(
  kind: "sync" | "reparse" = "sync",
) {
  const user = await requireUser();
  const config = kind === "sync" ? planningCenterConfig() : null;
  const today = new Date().toISOString().slice(0, 10);
  // A reparse operates on stored plans; its date bounds describe that data below.
  const initialPlans = kind === "reparse" ? await storedPlans(0) : [];
  const start =
    config?.startDate ??
    initialPlans.reduce(
      (date, plan) => (plan.service_date < date ? plan.service_date : date),
      today,
    );
  const run = await acquireRun(user.id, start, today, kind);
  const counters = {
    service_types_processed: 0,
    plans_processed: 0,
    items_processed: 0,
    scripture_references_found: 0,
  };
  const types = new Set<string>();
  let lastHeartbeat = 0;
  const heartbeat = async () => {
    if (Date.now() - lastHeartbeat > 15000) {
      await updateRun(run, {});
      lastHeartbeat = Date.now();
    }
  };
  try {
    if (config) {
      const client = new PlanningCenterClient(config);
      let matchingServiceTypes = 0;
      for await (const serviceTypes of client.pages(
        "service_types?per_page=100",
        serviceTypeSchema,
        heartbeat,
      ))
        for (const st of serviceTypes) {
          if (
            config.serviceTypeIds.length &&
            !config.serviceTypeIds.includes(st.id)
          )
            continue;
          matchingServiceTypes++;
          for await (const plans of client.pages(
            `service_types/${st.id}/plans?per_page=100&order=sort_date`,
            planSchema,
            heartbeat,
          ))
            for (const plan of plans) {
              const date = plan.attributes.sort_date.slice(0, 10);
              if (
                !plan.attributes.service_time_count ||
                date < start ||
                date > today
              )
                continue;
              const source: SourceItem[] = [];
              for await (const items of client.pages(
                `service_types/${st.id}/plans/${plan.id}/items?per_page=100`,
                itemSchema,
                heartbeat,
              )) {
                for (const item of items)
                  source.push({
                    planning_center_id: item.id,
                    title: item.attributes.title,
                    description: item.attributes.description ?? "",
                    html_details: item.attributes.html_details ?? "",
                    item_type: item.attributes.item_type,
                    sequence: item.attributes.sequence,
                    service_position: item.attributes.service_position,
                    planning_center_updated_at: item.attributes.updated_at,
                  });
              }
              const parsed = prepareItems(source);
              await replacePlan(
                run,
                {
                  planning_center_id: st.id,
                  name: st.attributes.name,
                  archived_at: st.attributes.archived_at,
                  planning_center_updated_at: st.attributes.updated_at,
                },
                {
                  planning_center_id: plan.id,
                  title: plan.attributes.title || plan.attributes.dates || date,
                  series_title: plan.attributes.series_title,
                  service_date: date,
                  display_dates: plan.attributes.dates,
                  planning_center_url: `https://services.planningcenteronline.com/plans/${plan.id}`,
                  planning_center_updated_at: plan.attributes.updated_at,
                },
                parsed,
              );
              types.add(st.id);
              counters.plans_processed++;
              counters.items_processed += parsed.length;
              counters.scripture_references_found += parsed.reduce(
                (n, i) => n + i.references.length,
                0,
              );
              counters.service_types_processed = types.size;
              await updateRun(run, counters);
            }
        }
      if (!matchingServiceTypes) {
        throw new AppError(
          422,
          "No accessible Planning Center Service Types match the configuration. Check PLANNING_CENTER_SERVICE_TYPE_IDS and the account's access.",
        );
      }
      if (!counters.plans_processed) {
        throw new AppError(
          422,
          `Planning Center connected, but no plans with service times matched ${start} through ${today}. Check PLANNING_CENTER_SYNC_START_DATE and the selected Service Types; choose an earlier start date to import history.`,
        );
      }
    } else {
      for (let offset = 0; ; offset += 500) {
        const plans = offset === 0 ? initialPlans : await storedPlans(offset);
        for (const plan of plans) {
          await heartbeat();
          const serviceType = await storedServiceType(plan.service_type_id);
          const items: SourceItem[] = [];
          for (let itemOffset = 0; ; itemOffset += 500) {
            const page = await storedItems(plan.id, itemOffset);
            items.push(
              ...page.map((item) => ({
                ...item,
                item_type: z
                  .enum(["item", "header", "media"])
                  .parse(item.item_type),
              })),
            );
            if (page.length < 500) break;
          }
          const parsed = prepareItems(items);
          await replacePlan(run, serviceType, plan, parsed);
          types.add(serviceType.id);
          counters.plans_processed++;
          counters.items_processed += parsed.length;
          counters.scripture_references_found += parsed.reduce(
            (n, i) => n + i.references.length,
            0,
          );
          counters.service_types_processed = types.size;
          await updateRun(run, counters);
        }
        if (plans.length < 500) break;
      }
    }
    await updateRun(run, {
      ...counters,
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    return { id: run, ...counters };
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : "Synchronization failed unexpectedly. Previously completed plans are preserved; retry the operation.";
    try {
      await updateRun(run, {
        ...counters,
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: message,
      });
    } catch {
      /* A superseded worker must not change the newer run. */
    }
    throw error instanceof AppError ? error : new AppError(500, message);
  }
}
