import { existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// Same env files as Vitest and support/auth.ts. CI sets the variables, and those win.
for (const f of ["../../.env.local", "../../../../.env"]) {
  const p = path.resolve(__dirname, f);
  if (existsSync(p)) process.loadEnvFile(p);
}

const OTP = process.env.SUPABASE_AUTH_TEST_OTP ?? "";
// One number per project: Playwright runs the iphone and pixel projects in parallel.
const numbers = {
  iphone: { commuter: "9000000006", driver: "9000000011" },
  pixel: { commuter: "9000000007", driver: "9000000012" },
} as const;
const number = (info: { project: { name: string } }) =>
  numbers[info.project.name as keyof typeof numbers] ?? numbers.iphone;

/** Types a national number into 03 and waits for the verify screen. */
async function requestCode(page: import("@playwright/test").Page, national: string) {
  await page.getByLabel("Mobile number").fill(national);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.waitForURL("**/login/verify**");
}

/** Types the six digits into the hidden field that drives the OTP cells. */
async function enterCode(page: import("@playwright/test").Page, code: string) {
  await page.getByLabel("6-digit code").fill(code);
}

// The screens ask for a foreground fix on 02, so the context has to be able to grant one.
test.use({ permissions: ["geolocation"], geolocation: { latitude: 15.4869, longitude: 120.5917 } });

test("commuter signs in and lands on home", async ({ page }, info) => {
  const { commuter } = number(info);
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Know where your ride is" })).toBeVisible();
  await page.getByRole("button", { name: "Find rides near me" }).click();

  // 02 Location: granting the permission moves on to 03.
  await page.waitForURL("**/location");
  await page.getByRole("button", { name: "Allow location" }).click();
  await page.waitForURL("**/login**");

  await expect(page.getByRole("heading", { name: "Add your mobile number" })).toBeVisible();
  await requestCode(page, commuter);

  // 04 shows the number it texted, prettified.
  await expect(page.getByRole("heading", { name: "Enter the 6-digit code" })).toBeVisible();
  await expect(page.getByText(`We sent it to +63 ${commuter.slice(0, 3)} ${commuter.slice(3, 6)} ${commuter.slice(6)}.`)).toBeVisible();

  await enterCode(page, OTP);
  await page.waitForURL("**/home");
  await expect(page.getByText("Nearby now")).toBeVisible();
  expect(errors).toEqual([]);
});

test("an invalid number shows state 24", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/login");
  await page.getByLabel("Mobile number").fill("917");
  await page.getByRole("button", { name: "Send code" }).click();

  // 24 Mobile number, error: the input border, an icon and the fix in words.
  await expect(page.getByText("Enter 10 digits after +63, like 917 482 1093")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/login");
  expect(errors).toEqual([]);
});

test("a wrong code shows state 25", async ({ page }, info) => {
  const { commuter } = number(info);
  // The number can send once every 5 seconds, and the previous test used the same one.
  await page.waitForTimeout(6_000);
  await page.goto("/login");
  await requestCode(page, commuter);
  await enterCode(page, "000000");

  // 25 Verify code, wrong code: an error line and a way to send a new code.
  await expect(page.getByText("That code is not right. Check the text message or send a new code.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send a new code" })).toBeVisible();
});

test("driver verifies a vehicle after a wrong try", async ({ page }, info) => {
  const { driver } = number(info);

  await page.goto("/");
  await page.getByRole("button", { name: "I'm a driver" }).click();
  await page.waitForURL("**/login?role=driver");
  await requestCode(page, driver);
  await enterCode(page, OTP);
  await page.waitForURL("**/driver/verify");

  await expect(page.getByRole("heading", { name: "Verify your vehicle" })).toBeVisible();

  // A wrong code and plate first.
  await page.getByLabel("Operator code").fill("WRONG-0000");
  await page.getByLabel("Plate number").fill("XXX 0000");
  await page.getByRole("button", { name: "Verify vehicle" }).click();
  await expect(page.getByText("That code and plate do not match. Check both with your operator.")).toBeVisible();

  // Then the seeded demo operator and vehicle.
  await page.getByLabel("Operator code").fill("TMP-5826");
  await page.getByLabel("Plate number").fill("TMB 2417");
  await page.getByRole("button", { name: "Verify vehicle" }).click();

  await expect(page.getByText("Tarlac-Bamban via Capas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Go to my route" })).toBeVisible();
});