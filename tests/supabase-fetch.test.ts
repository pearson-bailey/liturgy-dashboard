import { afterEach, it, expect, vi } from "vitest";
import { databaseFetch } from "@/lib/supabase/database-fetch";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it("retries a newly issued JWT read rejection once", async () => {
  vi.useFakeTimers();
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      Response.json(
        { code: "PGRST303", message: "JWT issued at future" },
        { status: 401 },
      ),
    )
    .mockResolvedValueOnce(Response.json([]));
  vi.stubGlobal("fetch", request);
  const result = databaseFetch("http://127.0.0.1/rest/v1/sync_runs");
  await vi.runAllTimersAsync();
  expect((await result).status).toBe(200);
  expect(request).toHaveBeenCalledTimes(2);
});
it("never retries a write or unrelated unauthorized read", async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      Response.json(
        { code: "PGRST303", message: "JWT issued at future" },
        { status: 401 },
      ),
    );
  vi.stubGlobal("fetch", request);
  await databaseFetch("http://127.0.0.1/rest/v1/items", { method: "POST" });
  expect(request).toHaveBeenCalledTimes(1);
  request.mockResolvedValue(
    Response.json(
      { code: "PGRST303", message: "JWT expired" },
      { status: 401 },
    ),
  );
  await databaseFetch("http://127.0.0.1/rest/v1/items");
  expect(request).toHaveBeenCalledTimes(2);
});
