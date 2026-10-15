import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const projectUrl = readFileSync(".env.local", "utf8").match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1].trim();
const authKey = `sb-${new URL(projectUrl!).hostname.split(".")[0]}-auth-token`;

test("live sign-in hides mock accounts and handles unavailable Google provider", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.route("**/auth/v1/settings", route => route.fulfill({ json: { external: { google: false } } }));
  await page.addInitScript(() => sessionStorage.setItem("fixihub-preview-identity", "00000000-0000-4000-8000-000000000104"));
  await page.goto("/account");
  await expect(page.locator(".identity-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Continue with Google", exact: true }).click();
  await expect(page.locator(".google-login-page").getByRole("alert")).toContainText("Google sign-in is being configured");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.goto("/profile");
  await expect(page.getByLabel("Account email")).toHaveCount(0);
});

test("Google OAuth uses PKCE, only Google, and the fixed local callback", async ({ page }) => {
  await page.route("**/auth/v1/settings", route => route.fulfill({ json: { external: { google: true } } }));
  let authorization = "";
  await page.route("**/auth/v1/authorize?**", route => { authorization = route.request().url(); return route.fulfill({ contentType: "text/html", body: "OAuth test destination" }); });
  await page.goto("/account");
  await page.getByRole("button", { name: "Continue with Google", exact: true }).click();
  await expect.poll(() => authorization).not.toBe("");
  const url = new URL(authorization);
  expect(url.searchParams.get("provider")).toBe("google");
  expect(url.searchParams.get("redirect_to")).toBe("http://127.0.0.1:3000/auth/callback");
  expect(url.searchParams.get("code_challenge")).toBeTruthy();
  expect(url.searchParams.get("code_challenge_method")?.toLowerCase()).toBe("s256");
});

test("cancelled callback offers recovery and clears provider data from the URL", async ({ page }) => {
  await page.goto("/auth/callback?error=access_denied&error_description=untrusted-provider-text");
  await expect(page.getByRole("heading", { name: "Let’s try signing in again." })).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/callback$/);
  await expect(page.locator("body")).not.toContainText("untrusted-provider-text");
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await expect(page.getByRole("button", { name: "Continue with Google", exact: true })).toBeVisible();
});

test("verified Google session shows profile, saves name and signs out", async ({ page }) => {
  const user = { id: "22222222-2222-4222-8222-222222222222", aud: "authenticated", role: "authenticated", email: "reader@example.test", created_at: "2026-10-15T00:00:00Z", app_metadata: { provider: "google", providers: ["google"] }, identities: [{ provider: "google", id: "google-test" }], user_metadata: { full_name: "Google Reader", avatar_url: "https://example.test/photo.png", role: "superadmin", fixihub_display_name: "" } };
  await page.route("**/auth/v1/user", async route => {
    if (route.request().method() === "PUT") user.user_metadata.fixihub_display_name = route.request().postDataJSON().data.fixihub_display_name;
    await route.fulfill({ json: user });
  });
  await page.route("**/auth/v1/logout**", route => route.fulfill({ status: 204 }));
  await page.route("https://example.test/photo.png", route => route.fulfill({ status: 404 }));
  await page.addInitScript(({ user, authKey }) => {
    if (sessionStorage.getItem("auth-test-seeded")) return;
    sessionStorage.setItem("auth-test-seeded", "yes");
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const jwt = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })) + "." + btoa(JSON.stringify({ sub: user.id, exp: expiry })) + ".test-signature";
    localStorage.setItem(authKey, JSON.stringify({ access_token: jwt, refresh_token: "test-only-refresh", expires_at: expiry, expires_in: 3600, token_type: "bearer", user }));
  }, { user, authKey });
  await page.goto("/profile");
  await expect(page.getByLabel("Account email")).toHaveValue("reader@example.test");
  await expect(page.getByRole("button", { name: "Account: Google Reader" })).toBeVisible();
  await page.getByLabel("Display name", { exact: true }).fill("My Reader Name");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByRole("button", { name: "Account: My Reader Name" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue("My Reader Name");
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await page.getByRole("button", { name: "Confirm logout" }).click();
  await expect(page.locator("header").getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), authKey)).toBeNull();
});
