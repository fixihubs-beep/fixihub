import { test, expect } from "@playwright/test";

test("catalogue filters combine and reset on compact mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/catalog");
  await expect(page.locator(".book-card")).toHaveCount(7);
  await page.getByRole("button", { name: "Horror", exact: true }).click();
  const count = await page.locator(".book-card").count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(7);
  await page.getByLabel("Search titles or authors").fill("Ariff");
  await expect(page.getByRole("heading", { name: "No matching stories." })).toBeVisible();
  await page.getByRole("button", { name: "Show all books" }).click();
  await expect(page.locator(".book-card")).toHaveCount(7);
  await page.getByLabel("Sort books").selectOption("az");
  await expect(page.locator(".book-card").first()).toContainText("AMUK");
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    expect(await page.locator(".book-grid").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length)).toBe(3);
    await page.screenshot({ path: `docs/screenshots/catalog-${width}.png`, fullPage: true });
  }
});
