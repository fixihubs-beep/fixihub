import { test, expect } from "@playwright/test";

const roles = [
  { name: "Sarah", tabs: ["Overview", "Orders", "Payment review"] },
  {
    name: "Amir",
    tabs: [
      "Overview",
      "Orders",
      "Payment review",
      "Catalog",
      "Campaigns",
      "Team & customers",
      "Reports",
      "Audit",
    ],
  },
  {
    name: "Hana",
    tabs: [
      "Overview",
      "Orders",
      "Payment review",
      "Catalog",
      "Campaigns",
      "Team & customers",
      "Reports",
      "Audit",
      "Security",
    ],
  },
];
for (const role of roles)
  test(`${role.name} workspace tabs respect role boundaries and fit mobile`, async ({
    page,
  }) => {
    await page.goto("/account");
    await page.getByRole("button", { name: new RegExp(role.name) }).click();
    await page.goto("/admin");
    const nav = page.getByRole("navigation", { name: "Workspace navigation" });
    await expect(nav.getByRole("button")).toHaveCount(role.tabs.length);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const tab of role.tabs) {
      await nav.getByRole("button", { name: tab, exact: true }).click();
      await expect(
        page.getByRole("heading", { name: tab, exact: true, level: 1 }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      if (role.name === "Hana")
        await page.screenshot({
          path: `docs/screenshots/workspace-${tab.replaceAll(" ", "-")}-mobile.png`,
          fullPage: true,
        });
    }
    if (role.name === "Sarah") {
      await expect(
        page.getByRole("button", { name: "Export orders" }),
      ).toHaveCount(0);
      await expect(nav.getByRole("button", { name: "Security" })).toHaveCount(
        0,
      );
    }
  });

test("access changes require confirmation, preserve self access, and audit changes", async ({
  page,
}) => {
  await page.goto("/account");
  await page.getByRole("button", { name: /Amir/ }).click();
  await page.goto("/admin");
  const nav = page.getByRole("navigation", { name: "Workspace navigation" });
  await nav.getByRole("button", { name: "Team & customers" }).click();
  const aina = page.getByRole("combobox", { name: /Role for Aina/ });
  await aina.selectOption("staff");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep current access" }).click();
  await expect(aina).toHaveValue("customer");
  await aina.selectOption("staff");
  await page
    .getByRole("button", { name: "Confirm access change", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(aina).toHaveValue("staff");
  await expect(
    page.getByRole("combobox", { name: /Role for Amir/ }),
  ).toBeDisabled();
  await expect(
    page.getByRole("combobox", { name: /Role for Hana/ }),
  ).toBeDisabled();
  await page.goto("/account");
  await page.getByRole("button", { name: /Hana/ }).click();
  await page.goto("/admin");
  await nav.getByRole("button", { name: "Security", exact: true }).click();
  await expect(page.getByText(/Aina.*staff, active/)).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await nav.getByRole("button", { name: "Overview", exact: true }).click();
  await page.screenshot({
    path: "docs/screenshots/workspace-desktop.png",
    fullPage: true,
  });
});

test("catalog edits, campaign validation, search and report export", async ({
  page,
}) => {
  await page.goto("/account");
  await page.getByRole("button", { name: /Amir/ }).click();
  await page.goto("/admin");
  const nav = page.getByRole("navigation", { name: "Workspace navigation" });
  await nav.getByRole("button", { name: "Catalog", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search catalog" }).fill("JELIK");
  await expect(page.getByRole("button", { name: "Edit book" })).toHaveCount(1);
  await page.getByRole("button", { name: "Edit book" }).click();
  await page.getByLabel("Title", { exact: true }).fill("JELIK — Preview edit");
  await page.getByRole("button", { name: "Save book" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("JELIK — Preview edit", { exact: true }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Campaigns", exact: true }).click();
  await page.getByRole("button", { name: "Edit preview schedule" }).click();
  await page.getByLabel("Closes (Malaysia time)").fill("2026-11-02T12:00");
  await page.getByRole("button", { name: "Save schedule" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "closing must not follow publication",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Pause new preorders" }).click();
  await expect(
    page.getByRole("button", { name: "Resume preorders" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume preorders" }).click();
  await expect(
    page.getByRole("button", { name: "Pause new preorders" }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Audit", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search audit" })
    .fill("catalog.updated");
  await expect(page.getByText("Updated JELIK.", { exact: true })).toBeVisible();
  await nav.getByRole("button", { name: "Reports", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export orders" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "kacau-preview-orders.csv",
  );
});
