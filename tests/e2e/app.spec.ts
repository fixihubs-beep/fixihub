import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const kacau = "/books/00000000-0000-4000-8000-000000000009";
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
});
async function identity(page: import("@playwright/test").Page, name: string) {
  await page.goto("/account");
  await page.getByRole("button", { name: new RegExp(name) }).click();
}
async function place(page: import("@playwright/test").Page) {
  await identity(page, "Aina");
  await page.goto(kacau);
  await page.getByRole("button", { name: "Reserve a copy" }).click();
  await page.goto("/cart");
  await page.getByRole("button", { name: "Join preorder queue" }).click();
  await expect(page.getByLabel("Contact email")).toHaveValue("aina@example.test");
  await page.getByLabel("Contact email").fill("preview@example.test");
  await page.getByLabel("Contact number").fill("0123456789");
  await page.getByLabel("Calling code").selectOption("+60");
  await page.getByLabel("Recipient name").fill("Fictional Reader");
  await page.getByLabel("Address line 1").fill("123 Example Road");
  await page.getByLabel("Postcode", { exact: true }).fill("50000");
  await page.getByLabel("City", { exact: true }).fill("Kuala Lumpur");
  await page.getByLabel("State / province").selectOption("Kuala Lumpur");
  await page.getByRole("button", { name: "Place preview preorder" }).click();
  await expect(page).toHaveURL(/\/orders/);
  await expect(page.locator(".order-card").first()).toContainText("+60123456789");
  await expect(page.locator(".order-card").first()).toContainText("Malaysia (MY)");
}
test("KACAU leads the storefront and other books cannot be purchased", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /KACAU/, level: 1 })).toBeVisible();
  await expect(
    page.getByText("12 November 2026", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/kacau-desktop.png",
    fullPage: true,
  });
  await page.goto("/books/00000000-0000-4000-8000-000000000001");
  await expect(
    page.getByRole("button", { name: "Currently unavailable for purchase" }),
  ).toBeDisabled();
  await page.goto("/catalog");
  await expect(page.locator(".book-card")).toHaveCount(7);
  await page.getByLabel("Search titles or authors").fill("Ariff");
  await expect(page.locator(".book-card")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/",
    "/catalog",
    kacau,
    "/account",
    "/preorders",
    "/about",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.goto("/");
  for (const cover of await page.locator(".book-card img").all()) {
    await cover.scrollIntoViewIfNeeded();
    await expect.poll(() => cover.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(100);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/kacau-mobile.png",
    fullPage: true,
  });
});
test("receipt rejection, resubmission, staff approval and customer isolation", async ({
  page,
}) => {
  await place(page);
  await expect(page.locator(".order-card")).toHaveCount(1);
  await expect(page.getByText("QR NOT CONFIGURED")).toBeVisible();
  const file = {
    name: "fictional.png",
    mimeType: "image/png",
    buffer: readFileSync("public/icons/icon-192.png"),
  };
  async function upload(reference: string) {
    await page.getByRole("button", { name: "Upload receipt" }).click();
    await page.getByLabel("Transfer reference").fill(reference);
    await page.getByLabel("Receipt file").setInputFiles(file);
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await upload("PREVIEW-001");
  await expect(page.locator(".order-card>.order-top")).toContainText(
    "payment review",
  );
  await identity(page, "Daniel");
  await page.goto("/orders");
  await expect(page.locator(".order-card")).toHaveCount(0);
  await identity(page, "Sarah");
  await page.goto("/admin");
  await expect(
    page.getByRole("button", { name: "Catalog", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Payment review/ }).click();
  await page.getByRole("button", { name: "Review receipt" }).click();
  await page
    .getByLabel("Decision note / rejection reason")
    .fill("Receipt is unreadable; upload a clearer image.");
  await page.getByRole("button", { name: "Reject receipt" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await identity(page, "Aina");
  await page.goto("/orders");
  await expect(page.getByRole("alert").filter({ hasText: "Receipt needs correction:" })).toBeVisible();
  await upload("PREVIEW-002");
  await identity(page, "Sarah");
  await page.goto("/admin");
  await page.getByRole("button", { name: /Payment review/ }).click();
  await page.getByRole("button", { name: "Review receipt" }).click();
  await expect(
    page.getByRole("button", { name: "Approve payment" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Load private receipt" }).click();
  await page.getByRole("checkbox").check();
  await page
    .getByLabel("Decision note / rejection reason")
    .fill("Simulated bank record matches payee, amount and reference.");
  await page.getByRole("button", { name: "Approve payment" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.screenshot({
    path: "docs/screenshots/kacau-workspace.png",
    fullPage: true,
  });
  await identity(page, "Aina");
  await page.goto("/orders");
  await expect(page.locator(".order-top")).toContainText("confirmed");
  await page.reload();
  await expect(page.locator(".order-top")).toContainText("confirmed");
});
test("customer cancellation releases copies and role navigation is restricted", async ({
  page,
}) => {
  await place(page);
  await page.getByRole("button", { name: "Cancel unpaid reservation" }).click();
  await expect(page.locator(".order-top")).toContainText("cancelled");
  await page.goto("/preorders");
  await expect(page.getByText("1,000 / 1,000 copies")).toBeVisible();
  await identity(page, "Amir");
  await page.goto("/admin");
  await expect(
    page.getByRole("button", { name: "Catalog", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Security", exact: true }),
  ).toHaveCount(0);
  await identity(page, "Hana");
  await page.goto("/admin");
  await page.getByRole("button", { name: "Security", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Launch controls" }),
  ).toBeVisible();
});

test("orders filters and compact mobile cards", async ({ page }) => {
  await place(page);
  await page.getByRole("button", { name: "Closed", exact: true }).click();
  await expect(page.locator(".order-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Show all orders" }).click();
  await expect(page.locator(".order-card")).toHaveCount(1);
  await expect(page.locator('.order-progress [aria-current="step"]')).toContainText("Reserved");
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: `docs/screenshots/orders-${width}.png`, fullPage: true });
  }
});
