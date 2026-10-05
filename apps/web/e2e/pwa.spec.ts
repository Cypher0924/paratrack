import { expect, test } from "@playwright/test";

test("manifest serves with scope /", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m).toMatchObject({ name: "ParaTrack", scope: "/", start_url: "/", display: "standalone" });
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
});

test("service worker registers without console errors", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toBe("http://localhost:3000/");
  expect(context.serviceWorkers().length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
