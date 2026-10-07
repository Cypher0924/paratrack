import { expect as baseExpect, test, type Browser, type TestInfo } from "@playwright/test";
import { signIn } from "./support/auth";

// One seeded vehicle per project, never TMB 2417. Numbers: 10/13 commuters, 14/15 drivers.
const setups = {
  iphone: {
    commuter: "+639000000010",
    driver: "+639000000014",
    plate: "TGR 4682",
    label: "Gerona 05",
    // Commuter stands at Salapungan Barangay Hall. The vehicle starts at the beginning of Tarlac-Gerona, 1.6 km before it.
    at: { latitude: 15.50748, longitude: 120.59619 },
    ping: { lat: 15.496054, lng: 120.593772 },
  },
  pixel: {
    commuter: "+639000000013",
    driver: "+639000000015",
    plate: "TLP 2859",
    label: "La Paz 04",
    // Metro Town Mall is on Tarlac-La Paz and Tarlac-Cabanatuan only. The vehicle starts at the beginning of Tarlac-La Paz, 1.3 km before it.
    at: { latitude: 15.48779, longitude: 120.59701 },
    ping: { lat: 15.496054, lng: 120.593772 },
  },
} as const;

type Signed = Awaited<ReturnType<typeof signIn>>;

test.describe.configure({ mode: "serial", timeout: 240_000 });
const expect = baseExpect.configure({ timeout: 30_000 });

let cfg: (typeof setups)[keyof typeof setups];
let driver: Signed;
let commuter: Signed;
let pinger: ReturnType<typeof setInterval> | undefined;

const ping = () => driver.client.rpc("driver_ping", { p_lat: cfg.ping.lat, p_lng: cfg.ping.lng, p_speed: 8 });

test.beforeAll(async ({}, info) => {
  cfg = setups[info.project.name as keyof typeof setups];
  driver = await signIn(cfg.driver);
  commuter = await signIn(cfg.commuter);
  const verified = await driver.client.rpc("verify_driver", { p_operator_code: "TMP-5826", p_plate: cfg.plate });
  if (verified.error) throw verified.error;
  const shift = await driver.client.rpc("start_shift");
  if (shift.error) throw shift.error;
  const first = await ping();
  if (first.error) throw first.error;
  pinger = setInterval(() => void ping(), 5000);
});

test.afterAll(async () => {
  clearInterval(pinger);
  await driver?.client.rpc("end_shift");
  // Leave no active trip behind for the next run.
  await commuter?.client.from("trips").update({ status: "ended" }).in("status", ["tracking", "onboard"]);
});

// Project settings carry the device emulation, so a context made by hand needs them too.
const commuterContext = (browser: Browser, info: TestInfo, baseURL: string | undefined) => {
  const { defaultBrowserType: _ignored, ...device } = info.project.use;
  return browser.newContext({
    ...device,
    // signIn writes the session for localhost:3000. Point it at whatever origin this run uses.
    storageState: { ...commuter.storageState, origins: commuter.storageState.origins.map((o) => ({ ...o, origin: baseURL ?? o.origin })) },
    permissions: ["geolocation"],
    geolocation: { ...cfg.at, accuracy: 10 },
  });
};

test("home lists the vehicle, tracking and the on board flow work", async ({ browser, baseURL }, info) => {
  const context = await commuterContext(browser, info, baseURL);
  const page = await context.newPage();
  await page.goto("/home");

  // The map marker has the same label, so match the row by its "from" text.
  const row = page.getByRole("button", { name: new RegExp(`${cfg.label} from`) });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect(row).toContainText(/\d+ min/);

  await row.click();
  await expect(page).toHaveURL(/\/vehicle\//);
  await expect(page.getByText(/\d+ min/).first()).toBeVisible();
  await page.getByRole("button", { name: /^Track this modern jeep/ }).click();

  await expect(page).toHaveURL(/\/trip\/[^/]+$/);
  await expect(page.getByText(/^Arriving at .* in$/)).toBeVisible();
  await expect(page.getByText(/^\d+ min$/).first()).toBeVisible();

  await page.getByRole("button", { name: "I'm on board" }).click();
  await expect(page).toHaveURL(/\/onboard$/);
  await expect(page.getByText(/^Get off at /)).toBeVisible();
  await expect(page.getByRole("switch", { name: /Para alert/ })).toBeVisible();

  await page.getByRole("button", { name: "End trip" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await context.close();
});

test("offline shows the banner", async ({ browser, baseURL }, info) => {
  const context = await commuterContext(browser, info, baseURL);
  const page = await context.newPage();
  await page.goto("/home");
  await expect(page.getByRole("button", { name: new RegExp(`${cfg.label} from`) })).toBeVisible({ timeout: 20_000 });
  await context.setOffline(true);
  await expect(page.getByText("You are offline")).toBeVisible({ timeout: 15_000 });
  await context.setOffline(false);
  await context.close();
});

test("the driver ending the shift shows stopped sharing", async ({ browser, baseURL }, info) => {
  const vehicleId = (await driver.client.from("drivers").select("vehicle_id").single()).data?.vehicle_id;
  const routeStops = await commuter.client.from("vehicles").select("route_id").eq("id", vehicleId!).single();
  const links = await commuter.client.from("route_stops").select("stop_id, seq").eq("route_id", routeStops.data!.route_id).order("seq");
  const ids = links.data!.map((l) => l.stop_id);
  const trip = await commuter.client
    .from("trips")
    .insert({ vehicle_id: vehicleId!, board_stop_id: ids[1], alight_stop_id: ids[ids.length - 1] })
    .select("id")
    .single();
  expect(trip.error).toBeNull();

  const context = await commuterContext(browser, info, baseURL);
  const page = await context.newPage();
  await page.goto(`/trip/${trip.data!.id}`);
  await expect(page.getByText(/^Arriving at /)).toBeVisible({ timeout: 20_000 });

  clearInterval(pinger);
  await driver.client.rpc("end_shift");
  await expect(page.getByText(/stopped sharing/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /Find another modern jeep/ })).toBeVisible();
  await context.close();
});
