import { test, expect } from "@playwright/test";

test("preorders is compact on mobile and reserves the featured edition", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/preorders");
    await expect(page.getByRole("heading", { name: "Preorders.", exact: true })).toBeVisible();
    const reserve = page.getByRole("button", { name: "Reserve a copy" });
    await expect(reserve).toBeEnabled();
    const box = await reserve.boundingBox();
    expect(box!.y + box!.height).toBeLessThan(844);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: `docs/screenshots/preorders-${width}.png`, fullPage: true });
  }
  await page.getByText("When will my book arrive?", { exact: true }).click();
  await expect(page.getByText(/This is not a delivery date/)).toBeVisible();
  await page.getByRole("button", { name: "Reserve a copy" }).click();
  await page.getByRole("link", { name: "View bag", exact: true }).click();
  await expect(page.locator(".cart-line")).toContainText("KACAU: Movie Tie-In");
});
