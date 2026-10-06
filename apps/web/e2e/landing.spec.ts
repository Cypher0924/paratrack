import { expect, test } from "@playwright/test";

const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// The projects emulate phones, which get Welcome at "/". The landing page is for desktop browsers.
test.describe("landing page", () => {
  test("renders without console errors and opens the web app", async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1280, height: 800 },
      userAgent: DESKTOP_UA,
      isMobile: false,
      hasTouch: false,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    // Headless Chromium has no WebGL, so Google Maps logs a vector-map warning as an error.
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && !m.text().includes("Vector Map") && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Know when your ride arrives" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Get the app" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Terms" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);

    await page.getByRole("link", { name: "Open the web app" }).first().click();
    await expect(page).toHaveURL(/\/start$/);
    await context.close();
  });

  test("phones get the Welcome screen at /", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Know when your ride arrives" })).toHaveCount(0);
  });
});
