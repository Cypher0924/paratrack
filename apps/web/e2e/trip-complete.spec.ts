import { createClient } from "@supabase/supabase-js";
import { devices, expect as baseExpect, test, type BrowserContext } from "@playwright/test";
import type { Database } from "@repo/core";
import { signIn } from "./support/auth";

// +639000000005 (iphone) and +639000000018 (pixel) are reserved for these tests.
const ROUTE = "b0000000-0000-4000-8000-000000000001"; // Downtown-SM
const RIZAL = "c0000000-0000-4000-8000-000000000002";
const SM = "c0000000-0000-4000-8000-000000000004";

test.describe.configure({ mode: "serial", timeout: 60_000 });
const expect = baseExpect.configure({ timeout: 15_000 });

let context: BrowserContext;
let userId: string;
let tripId: string;
let neverBoardedId: string;
const admin = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

test.beforeAll(async ({ browser }, info) => {
  const phone = info.project.name === "iphone" ? "+639000000005" : "+639000000018";
  const { user, storageState } = await signIn(phone);
  userId = user.id;
  await admin.from("trips").delete().eq("user_id", userId);
  await admin.from("profiles").update({ fare_type: "regular" }).eq("id", userId);
  const { data: vehicle } = await admin.from("vehicles").select("id").eq("route_id", ROUTE).limit(1).single();
  const insert = async () =>
    (await admin.from("trips").insert({ user_id: userId, vehicle_id: vehicle!.id, board_stop_id: RIZAL, alight_stop_id: SM }).select("id").single()).data!.id;
  tripId = await insert();
  // The trigger stamps boarded_at on the update to onboard.
  await admin.from("trips").update({ status: "onboard" }).eq("id", tripId);
  neverBoardedId = await insert();
  await admin.from("trips").update({ status: "ended" }).eq("id", neverBoardedId);
  context = await browser.newContext({ storageState, ...devices[info.project.name === "iphone" ? "iPhone 13" : "Pixel 7"] });
});

test.afterAll(async () => {
  await admin.from("trips").delete().eq("user_id", userId); // reports go with them
  await context?.close();
});

test("ending a trip opens the recap and feedback is saved", async () => {
  const page = await context.newPage();
  await page.goto(`/trip/${tripId}/onboard`);
  await page.getByRole("button", { name: "End trip" }).click();
  await expect(page).toHaveURL(new RegExp(`/trip/${tripId}/done`));
  await expect(page.getByText("You got off at SM City")).toBeVisible();
  await expect(page.getByText("Trip time")).toBeVisible();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
  await page.getByRole("checkbox", { name: "On time" }).click();
  await page.getByRole("checkbox", { name: "Clean" }).click();
  await page.getByRole("button", { name: "Send feedback" }).click();
  await expect(page).toHaveURL(/\/home/);
  await expect.poll(async () => (await admin.from("trips").select("feedback").eq("id", tripId).single()).data?.feedback.sort()).toEqual(["clean", "on_time"]);
  await page.close();
});

test("your trips lists the ride and skips the one never boarded", async () => {
  const page = await context.newPage();
  await page.goto("/account");
  await page.getByRole("button", { name: "Your trips" }).click();
  await expect(page).toHaveURL(/\/account\/trips/);
  await expect(page.getByRole("button", { name: /Downtown-SM to SM City/ })).toHaveCount(1);
  await expect(page.getByText("Trips are linked to your account, not to your location trail.")).toBeVisible();
  await page.getByRole("button", { name: /Downtown-SM to SM City/ }).click();
  await expect(page).toHaveURL(new RegExp(`/trip/${tripId}/done`));
  // Feedback is already sent, so there are no chips.
  await expect(page.getByRole("checkbox", { name: "On time" })).toHaveCount(0);
  await page.close();
});

test("a report is sent from the recap", async () => {
  const page = await context.newPage();
  await page.goto(`/trip/${tripId}/done`);
  await expect(page.getByText("You got off at SM City")).toBeVisible();
  await page.getByRole("button", { name: "Report a problem" }).click();
  await expect(page).toHaveURL(new RegExp(`/trip/${tripId}/report`));
  await expect(page.getByRole("button", { name: "Send report" })).toBeDisabled();
  await page.getByRole("radio", { name: /Unsafe driving/ }).click();
  await page.getByRole("textbox", { name: "What happened (optional)" }).fill("Overtook on a curve");
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page).toHaveURL(new RegExp(`/trip/${tripId}/done`));
  await expect(page.getByText("Report sent. Thank you.")).toBeVisible();
  const { data } = await admin.from("reports").select("kind,note").eq("trip_id", tripId);
  expect(data).toEqual([{ kind: "unsafe_driving", note: "Overtook on a curve" }]);
  await page.close();
});
