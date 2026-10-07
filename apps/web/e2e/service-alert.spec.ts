import { createClient } from "@supabase/supabase-js";
import { devices, expect as baseExpect, test, type BrowserContext } from "@playwright/test";
import type { Database } from "@repo/core";
import { signIn } from "./support/auth";

// +639000000021 (iphone) and +639000000022 (pixel) are reserved for these tests.
const GERONA = "b1000000-0000-4000-8000-000000000003"; // Tarlac-Gerona, shares stops with Tarlac-Paniqui
const ORIGIN = "c1000000-0000-4000-8000-000000000018"; // Salapungan, on both routes
const ORIGIN_KEY = "paratrack.originStopId";

test.describe.configure({ mode: "serial", timeout: 60_000 });
const expect = baseExpect.configure({ timeout: 15_000 });

let context: BrowserContext;
let userId: string;
let announcementId: number | undefined;
let notificationId: number | undefined;
let savedRoute = false;
let state: Awaited<ReturnType<typeof signIn>>["storageState"];
const admin = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

test.beforeAll(async ({ browser }, info) => {
  const phone = info.project.name === "iphone" ? "+639000000021" : "+639000000022";
  const { user, storageState } = await signIn(phone, info.project.use.baseURL);
  userId = user.id;
  state = storageState;
  await admin.from("profiles").update({ service_updates: true }).eq("id", userId);
  const saved = await admin.from("saved_routes").upsert({ user_id: userId, route_id: GERONA, alerts: true });
  expect(saved.error).toBeNull();
  savedRoute = true;
  context = await browser.newContext({ storageState, ...devices[info.project.name === "iphone" ? "iPhone 13" : "Pixel 7"] });
});

test.afterAll(async () => {
  if (notificationId) await admin.from("notifications").delete().eq("id", notificationId);
  if (announcementId) await admin.from("announcements").delete().eq("id", announcementId);
  if (savedRoute) await admin.from("saved_routes").delete().eq("user_id", userId).eq("route_id", GERONA);
  await context?.close();
});

test("tapping a service alert opens its detail with other routes", async () => {
  const title = `Tarlac-Gerona paused ${Date.now()}`;
  const ann = await admin.from("announcements").insert({ route_id: GERONA, title, body: "Lunch break, back at 1 PM." }).select("id").single();
  expect(ann.error).toBeNull();
  announcementId = ann.data!.id;
  // The announcement trigger may already have notified the saved route. Reuse that row, else insert one.
  const found = await admin.from("notifications").select("id").eq("user_id", userId).contains("data", { announcementId }).maybeSingle();
  if (found.data) notificationId = found.data.id;
  else {
    const n = await admin
      .from("notifications")
      .insert({ user_id: userId, kind: "service", title, body: "Lunch break, back at 1 PM.", data: { url: `/alerts/${announcementId}`, announcementId, routeId: GERONA } })
      .select("id")
      .single();
    expect(n.error).toBeNull();
    notificationId = n.data!.id;
  }

  const page = await context.newPage();
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [ORIGIN_KEY, ORIGIN]);
  await page.goto("/alerts");
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await expect(page).toHaveURL(new RegExp(`/alerts/${announcementId}$`));
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText(/^Posted today at .* by Tarlac-Gerona$/)).toBeVisible();
  await expect(page.getByText("Other routes nearby")).toBeVisible();
  await page.getByRole("button", { name: /Tarlac-Paniqui/ }).click();
  await expect(page).toHaveURL(/\/route\//);
  await page.close();
});

test("an unknown alert id shows not found", async () => {
  const page = await context.newPage();
  await page.goto("/alerts/999999999");
  await expect(page.getByText("We could not find this update")).toBeVisible();
  await page.close();
});

test("Not now on the primer closes it and does not block the action", async ({ browser }, info) => {
  test.skip(info.project.name === "iphone", "WebKit emulation has no web push, so the primer never shows");
  // Reuse the beforeAll sign-in: a second code request for the same number hits the auth rate limit.
  const ctx = await browser.newContext({ storageState: state, ...devices[info.project.name === "iphone" ? "iPhone 13" : "Pixel 7"] });
  await admin.from("profiles").update({ service_updates: false }).eq("id", userId);
  const page = await ctx.newPage();
  // Headless Chromium reports "denied" unless told otherwise.
  await page.addInitScript(() => Object.defineProperty(Notification, "permission", { get: () => "default" }));
  await page.goto("/account");
  // The switch reads on until the profile loads.
  await expect(page.getByRole("switch", { name: /Service updates/ })).not.toBeChecked();
  await page.getByRole("switch", { name: /Service updates/ }).click();
  const dialog = page.getByRole("dialog", { name: "Get alerts before your ride comes" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Not now" }).click();
  await expect(dialog).toHaveCount(0);
  // Snoozed: the next tap goes straight to the browser prompt, no primer.
  await expect(page.getByRole("switch", { name: /Service updates/ })).toBeChecked();
  await page.getByRole("switch", { name: /Service updates/ }).click();
  await page.getByRole("switch", { name: /Service updates/ }).click();
  await expect(dialog).toHaveCount(0);
  await ctx.close();
});
