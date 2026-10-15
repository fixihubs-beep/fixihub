import { test, expect } from "@playwright/test";

test("moving bookshelf sits between preorder and movie, with the complete grid below", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const sections = await page.locator(".kacau-hero, .moving-bookshelf, #film, .book-grid").evaluateAll(elements => elements.map(el => el.className));
  expect(sections).toEqual(["kacau-hero", "moving-bookshelf", "film-panel", "book-grid"]);
  await expect(page.locator(".book-grid .book-card")).toHaveCount(7);
  const track = page.locator(".bookshelf-track");
  expect(await track.evaluate(el => getComputedStyle(el).animationName)).toBe("bookshelf-left");
  await page.getByRole("button", { name: "Pause bookshelf" }).click();
  await expect(track).toHaveAttribute("data-paused", "true");
  expect(await track.evaluate(el => getComputedStyle(el).animationPlayState)).toBe("paused");
  await page.getByRole("button", { name: "Play bookshelf" }).click();
  await expect(track).toHaveAttribute("data-paused", "false");
  await expect(page.getByRole("link", { name: "View movie poster" })).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await track.evaluate(el => getComputedStyle(el).animationName)).toBe("none");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("mobile delivery form validates postcode and supports country changes", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/account");
  await page.getByRole("button", { name: /Aina/ }).click();
  await page.goto("/books/00000000-0000-4000-8000-000000000009");
  await page.getByRole("button", { name: "Reserve a copy" }).click();
  await page.goto("/cart");
  await page.getByRole("button", { name: "Join preorder queue" }).click();
  await expect(page.getByLabel("Country / region")).toHaveValue("MY");
  await expect(page.getByLabel("Calling code")).toHaveValue("+60");
  await page.getByLabel("Postcode", { exact: true }).fill("1234");
  expect(await page.getByLabel("Postcode", { exact: true }).evaluate(el => (el as HTMLInputElement).validity.patternMismatch)).toBeTruthy();
  await page.getByLabel("Country / region").selectOption("SG");
  await expect(page.getByLabel("State / province")).not.toHaveAttribute("required");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: "docs/screenshots/delivery-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  const fields = await page.locator(".checkout-details").boundingBox();
  const receipt = await page.locator(".checkout-receipt").boundingBox();
  expect(receipt!.x).toBeGreaterThan(fields!.x + fields!.width);
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.locator(".checkout-receipt .total")).toContainText("68.00");
  await expect(page).toHaveURL(/\/cart$/);
  await page.getByRole("button", { name: "Decrease quantity" }).click();
  await expect(page.locator(".checkout-receipt .total")).toContainText("35.00");
  await page.screenshot({ path: "docs/screenshots/checkout-receipt-desktop.png", fullPage: true });
});
