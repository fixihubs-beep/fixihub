import { test, expect } from "@playwright/test";

test("FIXIHUB recovery pages fit mobile and return to catalogue", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/missing-fixi-page");
  await expect(page.getByRole("heading", { name: "This page is missing." })).toBeVisible();
  await expect(page.locator(".fixi-error-brand img")).toHaveAttribute("alt", "FIXI");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: "docs/screenshots/fixi-error-mobile.png", fullPage: true });
  await page.getByRole("link", { name: "Browse books", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(page.getByRole("heading", { name: "All books." })).toBeVisible();
  await page.goto("/offline.html");
  await expect(page.getByRole("heading", { name: "A pause between chapters." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Try again/ })).toHaveAttribute("href", "/");
});
