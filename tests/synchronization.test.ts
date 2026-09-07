import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("@/services/auth-service", () => ({
  requireUser: async () => ({ id: "user" }),
}));
vi.mock("@/repositories/sync-runs-repository", () => ({
  acquireRun: vi.fn(async () => "run"),
  updateRun: vi.fn(async () => {}),
  readSyncStatus: vi.fn(),
}));
vi.mock("@/repositories/planning-center-data-repository", () => ({
  replacePlan: vi.fn(async () => "plan"),
  storedPlans: vi.fn(),
  storedItems: vi.fn(),
  storedServiceType: vi.fn(),
}));
import {
  synchronizePlanningCenter,
  prepareItems,
} from "@/services/planning-center-sync-service";
import { replacePlan } from "@/repositories/planning-center-data-repository";
import { updateRun } from "@/repositories/sync-runs-repository";
describe("sync orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PLANNING_CENTER_CLIENT_ID", "test");
    vi.stubEnv("PLANNING_CENTER_SECRET", "test");
    vi.stubEnv("PLANNING_CENTER_USER_AGENT", "Test suite");
    vi.stubEnv("PLANNING_CENTER_SYNC_START_DATE", "2020-01-01");
    vi.stubEnv("PLANNING_CENTER_SERVICE_TYPE_IDS", "");
  });
  it("records a useful failure when the configured range excludes history", async () => {
    vi.stubEnv("PLANNING_CENTER_SYNC_START_DATE", "2026-09-07");
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ data: [{ id: "1", attributes: { name: "Morning" } }] }),
      )
      .mockResolvedValueOnce(
        Response.json({
          data: [
            {
              id: "2",
              attributes: {
                sort_date: "2026-09-06T09:00:00-04:00",
                service_time_count: 1,
              },
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", request);
    try {
      await expect(synchronizePlanningCenter()).rejects.toThrow(
        "no plans with service times matched 2026-09-07",
      );
      expect(replacePlan).not.toHaveBeenCalled();
      expect(updateRun).toHaveBeenLastCalledWith(
        "run",
        expect.objectContaining({ status: "failed", plans_processed: 0 }),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("explains an unmatched Service Type filter without fetching plans", async () => {
    vi.stubEnv("PLANNING_CENTER_SERVICE_TYPE_IDS", "99");
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ data: [{ id: "1", attributes: { name: "Morning" } }] }),
      );
    vi.stubGlobal("fetch", request);
    try {
      await expect(synchronizePlanningCenter()).rejects.toThrow(
        "No accessible Planning Center Service Types match",
      );
      expect(request).toHaveBeenCalledTimes(1);
      expect(replacePlan).not.toHaveBeenCalled();
      expect(updateRun).toHaveBeenLastCalledWith(
        "run",
        expect.objectContaining({ status: "failed" }),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("writes classified non-song items and normalized references", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ data: [{ id: "1", attributes: { name: "Morning" } }] }),
      )
      .mockResolvedValueOnce(
        Response.json({
          data: [
            {
              id: "2",
              attributes: {
                title: "Sunday",
                sort_date: "2026-08-30T09:00:00-04:00",
                service_time_count: 1,
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          data: [
            {
              id: "3",
              attributes: {
                title: "God Calls",
                item_type: "header",
                sequence: 1,
              },
            },
            {
              id: "4",
              attributes: {
                title: "Call to Worship",
                description: "Psalm 95:1-7",
                item_type: "item",
                sequence: 2,
              },
            },
            {
              id: "5",
              attributes: {
                title: "Psalm 145",
                item_type: "song",
                sequence: 3,
              },
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", request);
    try {
      const result = await synchronizePlanningCenter();
      expect(result.items_processed).toBe(2);
      const payload = vi.mocked(replacePlan).mock.calls[0][3];
      expect(payload).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: "Call to Worship",
            liturgical_movement: "god-calls",
            references: expect.arrayContaining([
              expect.objectContaining({
                canonical_reference: "Ps.95.1-Ps.95.7",
              }),
            ]),
          }),
        ]),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("records failures without leaking provider response bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("private provider message", { status: 403 }),
        ),
    );
    try {
      await expect(synchronizePlanningCenter()).rejects.toThrow("HTTP 403");
      expect(updateRun).toHaveBeenCalledWith(
        "run",
        expect.objectContaining({
          status: "failed",
          error_message: expect.not.stringContaining(
            "private provider message",
          ),
        }),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("preparation is deterministic and does not retain duration", () => {
    const source = {
      planning_center_id: "1",
      title: "Reading",
      description: "John 3:16",
      html_details: "",
      item_type: "item" as const,
      sequence: 1,
      service_position: null,
      planning_center_updated_at: null,
    };
    expect(prepareItems([source])).toEqual(prepareItems([source]));
    expect(prepareItems([source])[0]).not.toHaveProperty("duration");
  });
});
