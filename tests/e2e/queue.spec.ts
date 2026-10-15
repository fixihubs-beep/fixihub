import { test, expect } from "@playwright/test";
const start = Date.parse("2026-10-15T04:00:00Z");
const key = "fixihub-preview-queue-v1";
async function setup(page: import("@playwright/test").Page) {
  await page.clock.install({ time: start });
  await page.goto("/account");
  await page.getByRole("button", { name: /Aina/ }).click();
  await page.goto("/books/00000000-0000-4000-8000-000000000009");
  await page.getByRole("button", { name: "Reserve a copy" }).click();
}
test("fifty active slots show waiting position then admit the next customer", async ({
  page,
}) => {
  await setup(page);
  await page.evaluate(
    ({ key, start }) =>
      localStorage.setItem(
        key,
        JSON.stringify(
          Array.from({ length: 51 }, (_, i) => ({
            id: `other-${i}`,
            joined: start - 1000 + i,
            state: i < 50 ? "active" : "waiting",
            expires: i < 50 ? start + 300000 : undefined,
          })),
        ),
      ),
    { key, start },
  );
  await page.goto("/cart");
  await page.getByRole("button", { name: "Join preorder queue" }).click();
  await expect(page.locator(".queue-position strong")).toHaveText("1");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/queue-waiting.png",
    fullPage: true,
  });
  await page.goto("/catalog");
  await expect(page.locator(".queue-floating")).toContainText("1 person ahead");
  await page.screenshot({
    path: "docs/screenshots/queue-floating.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "View queue" }).click();
  await page.evaluate((key) => {
    const q = JSON.parse(localStorage.getItem(key)!);
    q[0].state = "complete";
    q[1].state = "complete";
    localStorage.setItem(key, JSON.stringify(q));
  }, key);
  await page.clock.runFor(1500);
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByLabel("Contact email")).toBeVisible();
});
test("timer survives navigation and refresh, expires, and rejoin creates a new turn", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/cart");
  await page.getByRole("button", { name: "Join preorder queue" }).click();
  await expect(page.getByLabel("Contact email")).toBeVisible();
  const expiry = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!)[0].expires,
    key,
  );
  await page.goto("/catalog");
  await page.reload();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!)[0].expires,
      key,
    ),
  ).toBe(expiry);
  await page.clock.runFor(301000);
  await expect(page.locator(".queue-floating")).toContainText("time has ended");
  await page.getByRole("link", { name: "View queue" }).click();
  await expect(
    page.getByRole("button", { name: "Rejoin at the back" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Rejoin at the back" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
