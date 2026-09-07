import { describe, it, expect, vi } from "vitest";
import {
  PlanningCenterClient,
  itemSchema,
} from "@/lib/planning-center/planning-center-client";
const config = {
  clientId: "test",
  secret: "test",
  userAgent: "Local tests (example.test)",
  startDate: "2020-01-01",
  serviceTypeIds: [],
};
const item = (id: string) => ({
  id,
  attributes: {
    title: "Reading",
    description: "John 3:16",
    item_type: "item",
    sequence: Number(id),
    length: 12345,
  },
});
describe("Planning Center transport", () => {
  it("follows complete pagination serially and strips irrelevant API fields", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({
          data: [item("1")],
          links: {
            next: "https://api.planningcenteronline.com/services/v2/items?offset=1",
          },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ data: [item("2")], links: { next: null } }),
      );
    const pages = [];
    for await (const page of new PlanningCenterClient(
      config,
      request,
      async () => {},
    ).pages("items", itemSchema))
      pages.push(...page);
    expect(pages.map((p) => p.id)).toEqual(["1", "2"]);
    expect(pages[0].attributes).not.toHaveProperty("length");
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("honors Retry-After and bounds retries", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response("", { status: 429, headers: { "Retry-After": "2" } }),
      );
    const sleep = vi.fn(async () => {});
    const collect = async () => {
      for await (const page of new PlanningCenterClient(
        config,
        request,
        sleep,
      ).pages("items", itemSchema))
        void page;
    };
    await expect(collect()).rejects.toThrow("rate limited");
    expect(request).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls).toHaveLength(3);
    expect(sleep).toHaveBeenCalledWith(2000);
  });
  it("does not retry before a long requested delay", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response("", { status: 429, headers: { "Retry-After": "300" } }),
      );
    await expect(
      (async () => {
        for await (const page of new PlanningCenterClient(
          config,
          request,
        ).pages("items", itemSchema))
          void page;
      })(),
    ).rejects.toThrow("longer retry delay");
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("supports HTTP-date retry information", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-07T12:00:00Z"));
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response("", {
          status: 429,
          headers: { "Retry-After": "Mon, 07 Sep 2026 12:00:05 GMT" },
        }),
      )
      .mockResolvedValueOnce(Response.json({ data: [] }));
    const sleep = vi.fn(async () => {});
    try {
      for await (const page of new PlanningCenterClient(
        config,
        request,
        sleep,
      ).pages("items", itemSchema))
        void page;
      expect(sleep).toHaveBeenCalledWith(5000);
    } finally {
      vi.restoreAllMocks();
    }
  });
  it("rejects pagination links that could disclose credentials", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        data: [],
        links: { next: "https://example.test/steal" },
      }),
    );
    await expect(
      (async () => {
        for await (const page of new PlanningCenterClient(
          config,
          request,
          async () => {},
        ).pages("items", itemSchema))
          void page;
      })(),
    ).rejects.toThrow("invalid pagination");
    expect(request).toHaveBeenCalledTimes(1);
  });
});
