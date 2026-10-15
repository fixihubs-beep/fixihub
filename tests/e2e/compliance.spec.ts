import { test, expect } from "@playwright/test";

test("Privacy policy and terms comply with Google OAuth requirements and brand uniqueness", async ({
  page,
  request,
}) => {
  // 1. Verify custom brand logo assets exist and are served as valid images
  for (const asset of [
    "/brand/fixihublogo.jpg",
    "/brand/fixihublogo.png",
  ]) {
    const res = await request.get(asset);
    expect(res.ok()).toBeTruthy();
  }

  // Verify obsolete trademark logo is not present
  const obsoleteRes = await request.get("/brand/buku-fixi-logo.jpg");
  expect(obsoleteRes.status()).toBe(404);

  // 2. Test Privacy Policy page
  await page.goto("/privacy");
  await expect(page.locator("h1")).toHaveText("Privacy Policy");
  const privacyText = await page.locator("article.legal-page").innerText();

  // Must not have draft/preview disclaimer
  expect(privacyText).not.toContain("Preview policy — not yet effective");
  expect(privacyText).not.toContain("Draft · Updated");

  // Must contain mandatory Google API User Data Policy Limited Use disclosure
  expect(privacyText).toContain("Google API Services User Data Policy");
  expect(privacyText).toContain("Limited Use");

  // Must contain data collection disclosures
  expect(privacyText).toContain("Google Account Data");
  expect(privacyText).toContain("openid");
  expect(privacyText).toContain("email");
  expect(privacyText).toContain("profile");

  // Must contain account & data deletion procedures
  expect(privacyText).toContain("support@seladevs.my");
  expect(privacyText).toContain("Data Deletion Request");
  expect(privacyText).toContain("https://myaccount.google.com/permissions");

  // 3. Test Terms of Service page
  await page.goto("/terms");
  await expect(page.locator("h1")).toHaveText("Terms of Service");
  const termsText = await page.locator("article.legal-page").innerText();

  // Must have prominent link and section referencing privacy policy
  expect(termsText).toContain("Privacy Policy");
  expect(termsText).toContain("Google API Services User Data Policy");
  await expect(page.locator('a[href="/privacy"]').first()).toBeVisible();

  // 4. Test Home page branding
  await page.goto("/");
  const headerLogo = page.locator("header.header .brand img.fixi-mark");
  await expect(headerLogo).toBeVisible();
  await expect(headerLogo).toHaveAttribute("src", "/brand/fixihublogo.jpg");
  await expect(headerLogo).toHaveAttribute("alt", "FIXIHUB");
});
