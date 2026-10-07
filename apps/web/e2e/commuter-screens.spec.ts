import { createClient } from "@supabase/supabase-js";
import { devices, expect as baseExpect, test, type BrowserContext } from "@playwright/test";
import { fare, formatPeso, legDistanceKm } from "@repo/core";
import type { Database } from "@repo/core";
import { signIn } from "./support/auth";

// +639000000008 (iphone) and +639000000009 (pixel) are reserved for these tests.
const ROUTE = "b1000000-0000-4000-8000-000000000001"; // Tarlac-Bamban via Capas
const ROBINSONS = "c1000000-0000-4000-8000-000000000002";
const CAPAS = "c1000000-0000-4000-8000-000000000004";
const ORIGIN_KEY = "paratrack.originStopId";

test.describe.configure({ mode: "serial", timeout: 60_000 });
const expect = baseExpect.configure({ timeout: 15_000 });

let context: BrowserContext;
let userId: string;
let seeded: number[] = [];
const admin = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

test.beforeAll(async ({ browser }, info) => {
  const phone = info.project.name === "iphone" ? "+639000000008" : "+639000000009";
  const { user, storageState } = await signIn(phone);
  userId = user.id;
  await admin.from("profiles").update({ fare_type: "regular", arrival_alerts: true, service_updates: true }).eq("id", userId);
  context = await browser.newContext({ storageState, ...devices[info.project.name === "iphone" ? "iPhone 13" : "Pixel 7"] });
});

test.afterAll(async () => {
  if (seeded.length) await admin.from("notifications").delete().in("id", seeded);
  await context?.close();
});

test("search to Capas lists routes from the picked stop", async () => {
  const page = await context.newPage();
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [ORIGIN_KEY, ROBINSONS]);
  await page.goto("/search");
  await expect(page.getByRole("button", { name: /From, Robinsons Supermarket/ })).toBeVisible();
  await page.getByRole("textbox", { name: "To" }).fill("Capas");
  await page.getByRole("button", { name: "Capas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Routes to Capas" })).toBeVisible();
  await expect(page.getByText("Tarlac-Bamban via Capas")).toBeVisible();
  await expect(page.getByText("Wait times count only vehicles with seats left.")).toBeVisible();
  await page.close();
});

test("student fare total matches the core fare()", async () => {
  const { data: route } = await admin.from("routes").select("length_m,base_fare,base_km,per_km").eq("id", ROUTE).single();
  const { data: rs } = await admin.from("route_stops").select("stop_id,offset_m").eq("route_id", ROUTE).in("stop_id", [ROBINSONS, CAPAS]);
  const off = (id: string) => rs!.find((r) => r.stop_id === id)!.offset_m;
  const km = legDistanceKm(off(ROBINSONS), off(CAPAS), route!.length_m);
  const expected = fare({ baseFare: route!.base_fare!, baseKm: route!.base_km!, perKm: route!.per_km! }, km, "student");

  const page = await context.newPage();
  await page.goto(`/fare?route=${ROUTE}&from=${ROBINSONS}&to=${CAPAS}`);
  await page.getByRole("tab", { name: "Student" }).click();
  await expect(page.getByText("Student fare", { exact: true })).toBeVisible();
  await expect(page.getByText(formatPeso(expected.totalCentavos), { exact: true }).last()).toBeVisible();
  await expect(page.getByText("You pay", { exact: true })).toBeVisible();
  await page.close();
});

test("mark all as read clears unread", async () => {
  const rows = [
    { user_id: userId, kind: "arrival" as const, title: "Shuttle 04 is 2 min away", body: "Campus Loop" },
    { user_id: userId, kind: "service" as const, title: "Bus 2 is running late", body: "Tarlac-Clark" },
  ];
  // Earlier runs and announcements leave other rows behind; start from an empty inbox.
  await admin.from("notifications").delete().eq("user_id", userId);
  const { data, error } = await admin.from("notifications").insert(rows).select("id");
  expect(error).toBeNull();
  seeded = data!.map((r) => r.id);

  const page = await context.newPage();
  await page.goto("/alerts");
  await expect(page.getByText("Shuttle 04 is 2 min away")).toBeVisible();
  await expect(page.getByLabel("Unread")).toHaveCount(2);
  await page.getByRole("tab", { name: "Service" }).click();
  await expect(page.getByText("Shuttle 04 is 2 min away")).toHaveCount(0);
  await page.getByRole("tab", { name: "All" }).click();
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.getByLabel("Unread")).toHaveCount(0);
  await page.close();
});

test("account fare type persists after a reload", async () => {
  const page = await context.newPage();
  await page.goto("/account");
  await page.getByRole("tab", { name: "Senior" }).click();
  await expect(page.getByText("Senior fare, 20% off")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Senior fare, 20% off")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Senior" })).toHaveAttribute("aria-selected", "true");
  await page.close();
});

test("the stop picker sets the origin", async () => {
  const page = await context.newPage();
  await page.goto("/search");
  await page.getByRole("button", { name: /^From,/ }).click();
  await page.getByRole("textbox", { name: "Search stops" }).fill("Robinsons");
  await page.getByRole("button", { name: "Robinsons Supermarket", exact: true }).click();
  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByRole("button", { name: /From, Robinsons Supermarket/ })).toBeVisible();
  expect(await page.evaluate((k) => localStorage.getItem(k), ORIGIN_KEY)).toBe(ROBINSONS);
  await page.close();
});
