import { test, expect } from "@playwright/test";

test("production without mock opt-in disables checkout and identity switching", async ({ page }) => {
  test.skip(process.env.PLAYWRIGHT_LIVE_GUARD !== "1", "Run against a default production build with PLAYWRIGHT_LIVE_GUARD=1.");
  await page.addInitScript(() => {
    sessionStorage.setItem("fixihub-preview-identity", "00000000-0000-4000-8000-000000000104");
  });
  await page.goto("/account");
  await expect(page.getByText("Real login and payment collection are not enabled yet.")).toBeVisible();
  await expect(page.locator(".identity-card")).toHaveCount(0);
  await page.goto("/books/00000000-0000-4000-8000-000000000009");
  await expect(page.getByRole("button", { name: "Website preorders opening soon" })).toBeDisabled();
  await page.goto("/admin");
  await expect(page.locator(".admin-layout")).toHaveCount(0);
});
