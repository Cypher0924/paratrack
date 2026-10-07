import { createClient } from "@supabase/supabase-js";
import { devices, expect as baseExpect, test, type BrowserContext } from "@playwright/test";
import type { Database } from "@repo/core";
import { signIn } from "./support/auth";

// +639000000025 (iphone) and +639000000026 (pixel) are reserved for these tests.
const ROUTE = "b1000000-0000-4000-8000-000000000001"; // Tarlac-Bamban via Capas

test.describe.configure({ mode: "serial", timeout: 60_000 });
const expect = baseExpect.configure({ timeout: 15_000 });

let context: BrowserContext;
let userId: string;
const admin = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

test.beforeAll(async ({ browser }, info) => {
  const phone = info.project.name === "iphone" ? "+639000000025" : "+639000000026";
  const { user, storageState } = await signIn(phone);
  userId = user.id;
  await admin.from("saved_places").delete().eq("user_id", userId);
  await admin.from("saved_routes").delete().eq("user_id", userId);
  context = await browser.newContext({ storageState, ...devices[info.project.name === "iphone" ? "iPhone 13" : "Pixel 7"] });
});

test.afterAll(async () => {
  await admin.from("saved_places").delete().eq("user_id", userId);
  await admin.from("saved_routes").delete().eq("user_id", userId);
  await context?.close();
});

test("add a place from Account", async () => {
  const page = await context.newPage();
  await page.goto("/account/places");
  await page.getByRole("button", { name: "Add a place" }).click();
  const save = page.getByRole("button", { name: "Save place" });
  await expect(save).toBeDisabled();
  await page.getByRole("textbox", { name: "Name" }).fill("Home");
  await page.getByRole("textbox", { name: "Nearest stop" }).fill("Robinsons");
  await expect(save).toBeDisabled();
  await page.getByRole("button", { name: "Robinsons Supermarket" }).click();
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page).toHaveURL(/\/account\/places$/);
  await expect(page.getByRole("button", { name: /Home/ })).toBeVisible();
  const { data } = await admin.from("saved_places").select("label").eq("user_id", userId);
  expect(data?.map((p) => p.label)).toEqual(["Home"]);
  await page.close();
});

test("bookmark a route, undo, then save it again", async () => {
  const page = await context.newPage();
  await page.goto(`/route/${ROUTE}`);
  await page.getByRole("button", { name: "Save route" }).click();
  await expect(page.getByText(/Saved\. You get alerts for/)).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Save route" })).toBeVisible();
  await expect.poll(async () => (await admin.from("saved_routes").select("route_id").eq("user_id", userId)).data?.length).toBe(0);
  await page.getByRole("button", { name: "Save route" }).click();
  await expect(page.getByRole("button", { name: "Remove from saved routes" })).toBeVisible();
  await page.close();
});

test("the alerts switch updates the saved route", async () => {
  const page = await context.newPage();
  await page.goto("/account/routes");
  await expect(page.getByText("Alerts for delays and full vehicles.")).toBeVisible();
  await page.getByRole("switch", { name: /^Alerts for/ }).click();
  await expect(page.getByText("Alerts off.")).toBeVisible();
  await expect
    .poll(async () => (await admin.from("saved_routes").select("alerts").eq("user_id", userId).single()).data?.alerts)
    .toBe(false);
  await page.close();
});
