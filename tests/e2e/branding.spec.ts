import { test, expect } from "@playwright/test";

test("FIXI install branding and live seconds fit mobile", async ({ page, request }) => {
  await page.clock.install({ time: new Date("2026-10-15T04:00:00Z") });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await expect(page).toHaveTitle("fixihub");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/icons/fixi-32.png");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/icons/fixi-180.png");
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.name).toBe("fixihub");
  expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual(["/icons/fixi-192.png", "/icons/fixi-512.png"]);
  for (const size of [32, 180, 192, 512]) {
    const response = await request.get(`/icons/fixi-${size}.png`);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/png");
  }
  const seconds = page.locator(".film-countdown > div").filter({ hasText: "seconds" }).locator("strong");
  await expect(seconds).toBeVisible();
  const before = Number(await seconds.innerText());
  await page.clock.runFor(1000);
  await expect(seconds).toHaveText(String((before + 59) % 60));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
