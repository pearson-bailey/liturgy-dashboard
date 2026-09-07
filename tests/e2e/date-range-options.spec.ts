import { test, expect } from "@playwright/test";

test("element options follow draft dates before applying filters", async ({
  page,
}) => {
  const base = "http://127.0.0.1:3000";
  const login = await page.request.post(`${base}/api/auth/sign-in`, {
    headers: { Origin: base },
    data: { email: "elder@example.test", password: "Local-elders-2026!" },
  });
  expect(login.status()).toBe(200);
  const all = await (
    await page.request.get(`${base}/api/dashboard/filters`)
  ).json();
  const usage = await (
    await page.request.get(`${base}/api/dashboard/scripture-usage`)
  ).json();
  const date = usage.recent[0].date;
  const rangedResponse = await page.request.get(
    `${base}/api/dashboard/filters?from=${date}&to=${date}`,
  );
  expect(rangedResponse.status()).toBe(200);
  const ranged = await rangedResponse.json();
  expect(ranged.elements.length).toBeGreaterThan(0);
  expect(
    ranged.elements.every((element: { key: string }) =>
      all.elements.some(
        (candidate: { key: string }) => candidate.key === element.key,
      ),
    ),
  ).toBe(true);

  await page.goto("/dashboard");
  const apply = page.getByRole("button", {
    name: "Apply filters",
    exact: true,
  });
  await expect(apply).toBeEnabled();
  await page.getByLabel("From", { exact: true }).fill(date);
  await page.getByLabel("Through", { exact: true }).fill(date);
  await expect(apply).toBeEnabled();
  const elements = page.getByRole("group", {
    name: "Liturgical element",
    exact: true,
  });
  await elements.locator("summary").click();
  await expect(elements.getByRole("checkbox")).toHaveCount(
    ranged.elements.length,
  );
  expect(
    await elements
      .getByRole("checkbox")
      .evaluateAll((inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      ),
  ).toEqual(ranged.elements.map((element: { key: string }) => element.key));
  expect(new URL(page.url()).searchParams.has("from")).toBe(false);
  await elements.getByRole("checkbox").first().check();
  await elements.locator("summary").click();
  await apply.click();
  await expect(page).toHaveURL(new RegExp(`from=${date}&to=${date}&element=`));
  await expect(apply).toBeEnabled();
  await page.reload();
  await expect(apply).toBeEnabled();
  await expect(elements.locator("summary")).toHaveText("1 selected");

  await page.getByLabel("From", { exact: true }).fill("1900-01-01");
  await page.getByLabel("Through", { exact: true }).fill("1900-01-01");
  await expect(
    page.getByText("No elements occurred within these dates."),
  ).toBeVisible();
  await elements.locator("summary").click();
  await expect(elements.getByRole("checkbox")).toHaveCount(0);
  await page.getByLabel("From", { exact: true }).fill("1900-01-02");
  await expect(
    page.getByText("From must be on or before Through."),
  ).toBeVisible();
  await expect(apply).toBeDisabled();
  expect(
    (
      await page.request.get(
        `${base}/api/dashboard/filters?from=1900-01-02&to=1900-01-01`,
      )
    ).status(),
  ).toBe(400);

  await page.getByLabel("From", { exact: true }).fill("");
  await page.getByLabel("Through", { exact: true }).fill("");
  await expect(apply).toBeEnabled();
  await expect(elements.getByRole("checkbox")).toHaveCount(all.elements.length);
});
