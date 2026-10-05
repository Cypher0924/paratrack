import { expect, test } from "@playwright/test";

test("components-b gallery renders without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/components-b");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
  await expect(page).toHaveScreenshot("components-b.png", { fullPage: true });

  // Tapping the handle toggles the sheet.
  await page.getByRole("button", { name: "Expand sheet" }).click();
  await expect(page.getByRole("button", { name: "Collapse sheet" })).toHaveAttribute("aria-expanded", "true");
});
