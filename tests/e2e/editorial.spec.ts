import { test, expect } from "@playwright/test";
import { initialData } from "../../lib/seed";

test("public books have sourced synopses and edition-aware reader information", async ({
  page,
}) => {
  for (const book of initialData.books.filter((book) => book.active)) {
    await page.goto(`/books/${book.id}`);
    await expect(
      page.getByRole("heading", { name: "Synopsis", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator(".book-synopsis .editorial-source"),
    ).toHaveAttribute("href", /^https:\/\//);
    expect(
      await page.locator(".book-insights details").count(),
    ).toBeGreaterThan(0);
  }
  await page.getByText("Reader rating", { exact: false }).click();
  await expect(
    page.getByText("Original 2014 ebook — not the movie tie-in edition"),
  ).toBeVisible();
  await expect(
    page.getByText(/Indexed snapshot retrieved 15 October 2026/),
  ).toBeVisible();
  await page.getByText("About Ariff Adly", { exact: true }).click();
  await page.screenshot({
    path: "docs/screenshots/kacau-editorial.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("movie poster loads and the film panel fits mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#film");
  const poster = page.getByAltText(
    "KACAU movie poster — in cinemas 12 November 2026",
  );
  await poster.scrollIntoViewIfNeeded();
  await expect
    .poll(
      () => poster.evaluate((el) => (el as HTMLImageElement).naturalWidth),
      { timeout: 20000 },
    )
    .toBeGreaterThan(100);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .locator(".film-panel")
    .screenshot({ path: "docs/screenshots/kacau-poster-mobile.png" });
});
