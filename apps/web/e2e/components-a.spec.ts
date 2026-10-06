import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test("components A gallery renders without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await page.goto("/dev/components-a");
  expect(response?.ok()).toBe(true);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  expect(errors).toEqual([]);
  await expect(page).toHaveScreenshot("components-a.png", { fullPage: true });
});
