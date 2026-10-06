import { expect, test } from "@playwright/test";
import { signIn } from "./support/auth";

// Each project uses its own number and vehicle so the two can run in parallel.
const drivers = {
  iphone: { phone: "+639000000016", code: "TPC-0412", plate: "TCA 7742", capacity: 16 },
  pixel: { phone: "+639000000019", code: "CSS-1001", plate: "NDF 1089", capacity: 14 },
} as const;

test("driver starts a shift, counts passengers, marks full, goes offline", async ({ browser, baseURL }, testInfo) => {
  const d = drivers[testInfo.project.name as keyof typeof drivers];
  const { client, storageState } = await signIn(d.phone, baseURL);
  try {
    await client.rpc("end_shift"); // a previous failed run may have left it online
    const v = await client.rpc("verify_driver", { p_operator_code: d.code, p_plate: d.plate });
    expect(v.error).toBeNull();

    const { defaultBrowserType: _, ...device } = testInfo.project.use;
    const context = await browser.newContext({
      ...device,
      storageState,
      geolocation: { latitude: 15.489709, longitude: 120.592027, accuracy: 5 },
      permissions: ["geolocation"],
    });
    const page = await context.newPage();
    await page.goto("/driver");

    await expect(page.getByText("Start your shift")).toBeVisible();
    await page.getByRole("button", { name: "Go online" }).click();
    await expect(page.getByText("Passengers on board")).toBeVisible();
    await expect(page.getByText(`of ${d.capacity} seats`)).toBeVisible();

    // The shared location reaches vehicle_live through /api/driver/ping.
    const vehicleId = (await client.from("drivers").select("vehicle_id").single()).data!.vehicle_id!;
    await expect
      .poll(async () => (await client.from("vehicle_live").select("lat").eq("vehicle_id", vehicleId).single()).data?.lat, {
        timeout: 20_000,
      })
      .toBeCloseTo(15.489709, 4);

    await page.getByRole("button", { name: "Add passenger" }).click();
    await page.getByRole("button", { name: "Add passenger" }).click();
    await expect(page.getByText("2", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Remove passenger" }).click();
    await expect(page.getByText("1", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Mark as full" }).click();
    await expect(page.getByText("Commuters now see you as full.")).toBeVisible();
    await expect(page.getByText("Marked full")).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("button", { name: "Mark as full" })).toBeVisible();

    await page.getByRole("button", { name: "Go offline" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Go offline?")).toBeVisible();
    await dialog.getByRole("button", { name: "Go offline" }).click();
    await expect(page.getByText("Start your shift")).toBeVisible({ timeout: 30_000 });
  } finally {
    await client.rpc("end_shift");
  }
});
