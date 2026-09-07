import { test, expect } from "@playwright/test";
import { loadEnvFile } from "node:process";
import { createClient } from "@supabase/supabase-js";
loadEnvFile(".env.local");
const localUrl = process.env.SUPABASE_URL!;
if (!["localhost", "127.0.0.1"].includes(new URL(localUrl).hostname))
  throw Error("Browser tests require local Supabase.");
const admin = createClient(localUrl, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});
test("protects every application endpoint and dashboard", async ({
  page,
  request,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/sign-in/);
  for (const url of [
    "/api/dashboard/scripture-usage",
    "/api/dashboard/filters",
    "/api/dashboard/chapter-details?selectedBook=John&chapter=3",
    "/api/sync/status",
  ])
    expect((await request.get(url)).status()).toBe(401);
  for (const url of ["/api/sync/planning-center", "/api/sync/reparse"])
    expect(
      (
        await request.post(url, {
          headers: { Origin: "http://127.0.0.1:3000" },
        })
      ).status(),
    ).toBe(401);
  await expect(
    page.getByText("Access is by invitation.", { exact: false }),
  ).toBeVisible();
});
test("signs in, explores all chapters, filters, reparses and signs out", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill("elder@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Local-elders-2026!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Scripture coverage" }),
  ).toBeVisible();
  await expect(page.locator(".chapter")).toHaveCount(1189);
  await expect(page.locator(".book-row")).toHaveCount(66);
  const detail = await page.request.get(
    "/api/dashboard/chapter-details?book=Rom&selectedBook=Ps&chapter=95",
  );
  expect((await detail.json()).total).toBe(0);
  expect(
    (
      await page.request.post("/api/sync/reparse", {
        headers: { Origin: "https://example.test" },
      })
    ).status(),
  ).toBe(403);
  await expect(
    page.getByRole("button", { name: /Psalms 95: 5 usages/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Recency", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Recency", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".chapter")).toHaveCount(1189);
  await page.getByRole("button", { name: /Psalms 95: 5 usages/ }).focus();
  await expect(page.locator(".heatmap-help")).toContainText("5 usages");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Call to Worship", { exact: true })
      .first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByLabel("Liturgical movement").selectOption("god-renews");
  await page.getByLabel("Liturgical element").selectOption("sermon");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(
    page.getByRole("button", { name: /Psalms 95: 0 usages/ }),
  ).toBeVisible();
  await expect(page.locator(".recent-panel tbody tr")).toHaveCount(6);
  await page.reload();
  await expect(page.getByLabel("Liturgical element")).toHaveValue("sermon");
  await expect(page.locator(".recent-panel tbody tr")).toHaveCount(6);
  await page.getByLabel("Liturgical movement").selectOption("god-calls");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(
    page.getByText("No Scripture usages match these filters.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Psalms 95: 5 usages/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reparse stored items" }).click();
  await expect(page.getByText(/Completed: 6 plans/)).toBeVisible();
  await expect(page.locator(".chapter")).toHaveCount(1189);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/dashboard-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/dashboard-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/sign-in/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/sign-in/);
});
test("accepts invitations, updates passwords and handles invalid callbacks", async ({
  page,
}) => {
  const email = `invite-${Date.now()}@example.test`;
  const invite = await admin.auth.admin.generateLink({ type: "invite", email });
  expect(invite.error).toBeNull();
  try {
    await page.goto(
      `/auth/confirm?token_hash=${invite.data.properties!.hashed_token}&type=invite`,
    );
    await expect(page).toHaveURL(/update-password/);
    await page.getByLabel("New password").fill("Invited-elders-2026!");
    await page.getByRole("button", { name: "Save password" }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/sign-in/);
    const recovery = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    });
    expect(recovery.error).toBeNull();
    await page.goto(
      `/auth/confirm?token_hash=${recovery.data.properties!.hashed_token}&type=recovery`,
    );
    await expect(page).toHaveURL(/update-password/);
    await page.getByLabel("New password").fill("Recovered-elders-2026!");
    await page.getByRole("button", { name: "Save password" }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto("/auth/confirm?token_hash=invalid&type=recovery");
    await expect(page).toHaveURL(/error=invalid-link/);
    await expect(page.locator('.notice[role="alert"]')).toContainText(
      "invalid or expired",
    );
  } finally {
    await admin.auth.admin.deleteUser(invite.data.user!.id);
  }
});
test("forgotten-password request is useful without account disclosure", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill("elder@example.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "If an invited account exists",
  );
});
