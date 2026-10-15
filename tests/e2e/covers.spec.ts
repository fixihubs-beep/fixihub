import { test, expect } from "@playwright/test";
import { initialData } from "../../lib/seed";
test("published catalog covers load and KACAU displays the supplied jacket", async ({
  page,
}) => {
  await page.goto("/catalog");
  for (const book of initialData.books.filter(
    (b) => b.active && b.cover_image,
  )) {
    const image = page.getByAltText(`Kulit buku ${book.title}`, {
      exact: true,
    });
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(100);
  }
  await expect(page.getByText("OFFICIAL COVER PENDING")).toHaveCount(0);
  await page.goto("/books/00000000-0000-4000-8000-000000000009");
  await expect(page.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "-24",
  );
  await expect(page.getByRole("button", { name: /^(Front|Back) cover$/ })).toHaveCount(0);
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: /Rotate .* right/ }).click();
  await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "156");
  await expect(
    page.getByAltText("Back cover of KACAU: Movie Tie-In"),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/kacau-back-cover.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: /Reset .* rotation/ }).click();
  await page.screenshot({
    path: "docs/screenshots/kacau-product.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("film credits link to the source and reduced motion disables entrances", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByText("Muzzamer Rahman", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Le Mediator Studio", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore @filemkacau" }),
  ).toHaveAttribute("href", "https://www.instagram.com/filemkacau/");
  expect(
    await page
      .locator(".hero-book-link")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(
    await page
      .locator(".hero-book-link")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("jacket-arrive");
});

test("product rotation supports keyboard and mobile", async ({ page }) => {
  await page.goto("/books/00000000-0000-4000-8000-000000000009");
  const preview = page.getByRole("group", {
    name: "3D preview of KACAU: Movie Tie-In",
    exact: true,
  });
  const slider = preview.getByRole("slider");
  await expect(slider).toHaveAttribute("aria-valuenow", "-24");
  await preview.getByRole("button", { name: /right$/ }).click();
  await expect(slider).toHaveAttribute("aria-valuenow", "21");
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "51");
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "-24");
  const bounds = (await slider.boundingBox())!;
  await page.mouse.move(bounds.x + 30, bounds.y + 60);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 130, bounds.y + 60, { steps: 8 });
  await page.mouse.up();
  await expect(slider).toHaveAttribute("aria-valuenow", "56");
  await expect(page).toHaveURL(
    /\/books\/00000000-0000-4000-8000-000000000009$/,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await preview.getByRole("button", { name: /Reset/ }).click();
  expect(await slider.evaluate((el) => getComputedStyle(el).touchAction)).toBe(
    "pan-y",
  );
  await expect(slider).toHaveAttribute("aria-valuenow", "-24");
  await page.screenshot({
    path: "docs/screenshots/rotatable-product-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("mobile shelf is static and three columns at narrow widths", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator(".book-card .rotation-controls")).toHaveCount(0);
    expect(
      await page
        .locator(".book-grid")
        .evaluate(
          (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
        ),
    ).toBe(3);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const cta = await page
      .getByRole("link", { name: "Discover the preorder" })
      .boundingBox();
    expect(cta!.y + cta!.height).toBeLessThan(844);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/compact-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});
