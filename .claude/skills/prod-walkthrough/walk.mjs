// Usage: node .claude/skills/prod-walkthrough/walk.mjs [wide] [outDir]
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const require = createRequire(ROOT + "apps/web/package.json");
const { chromium, devices } = require("@playwright/test");
process.loadEnvFile(ROOT + ".env");
const BASE = process.env.WALK_BASE ?? "https://paratrack-tau.vercel.app";
const OUT = process.argv[3] ?? `${tmpdir()}/paratrack-walk`;
mkdirSync(OUT, { recursive: true });
const OTP = process.env.SUPABASE_AUTH_TEST_OTP;
const OPERATOR = process.env.WALK_OPERATOR_CODE ?? "TMP-5826";
const wide = process.argv[2] === "wide";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  ...(wide ? { viewport: { width: 1440, height: 900 } } : devices["Pixel 7"]),
  geolocation: { latitude: 15.4869, longitude: 120.5917 },
  permissions: ["geolocation", "notifications"],
});
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 160)));
let n = 0;
const tag = wide ? "w" : "m";
async function step(name, fn) {
  n++;
  const before = errors.length;
  try {
    await fn();
    await page.waitForTimeout(1200);
    console.log(`OK   ${String(n).padStart(2)} ${name} -> ${new URL(page.url()).pathname}${new URL(page.url()).search}`);
  } catch (e) {
    console.log(`FAIL ${String(n).padStart(2)} ${name} @ ${new URL(page.url()).pathname}: ${String(e.message).split("\n")[0].slice(0, 150)}`);
  }
  for (const x of errors.slice(before)) console.log(`     console: ${x}`);
  await page.screenshot({ path: `${OUT}/${tag}-${String(n).padStart(2, "0")}-${name.replace(/\W+/g, "_").slice(0, 40)}.png` }).catch(() => {});
}
const btn = (name) => page.getByRole("button", { name, exact: false }).first();
const code = async () => { const f = page.getByLabel("6-digit code"); await f.waitFor(); await f.fill(OTP); };

await step("open welcome", () => page.goto(BASE + "/", { waitUntil: "load" }));
await step("find rides", () => btn("Find rides near me").click());
await step("allow location", () => btn("Allow location").click());
await step("enter number", async () => { await page.getByLabel("Mobile number").fill(wide ? "9000000003" : "9000000001"); await btn("Send code").click(); await page.waitForURL("**/login/verify**"); });
await step("enter code", async () => { await code(); await page.waitForURL("**/home**", { timeout: 15000 }); });
await step("home loaded", () => page.getByText(/Nearby now|Where are you|No vehicles/).first().waitFor());
await step("open search", () => page.getByText("Where to?").first().click());
await step("search Capas", async () => { const i = page.getByRole("textbox").last(); await i.fill("Capas"); await page.getByText(/^Capas$/).first().click(); });
await step("open a route", () => page.locator('[role="button"]').filter({ hasText: /min|No vehicles|full/ }).first().click());
await step("back to home", async () => { await page.goBack(); await page.goto(BASE + "/home"); });
await step("tab alerts", () => page.getByRole("tab", { name: /Alerts/ }).first().click());
await step("filter arrivals", () => page.getByRole("tab", { name: "Arrivals" }).click());
await step("tab account", () => page.getByRole("tab", { name: /Account/ }).first().click());
await step("fare student", () => page.getByRole("tab", { name: "Student" }).click());
await step("switch to driver", () => page.getByText("Switch to driver mode").click());
await step("verify vehicle", async () => { await page.getByLabel("Operator code").fill(OPERATOR); await page.getByLabel("Plate number").fill(wide ? "TGR 9017" : "TMB 5930"); await btn("Verify vehicle").click(); });
await step("go to route", () => btn(/Go to my route|Start/).click());
await step("start shift", () => btn("Go online").click());
await step("add passenger", () => page.getByRole("button", { name: /Add passenger/ }).click());
await step("mark full", () => btn("Mark as full").click());
await step("driver tab alerts", () => page.getByRole("tab", { name: /Alerts/ }).first().click());
await step("driver tab account", () => page.getByRole("tab", { name: /Account/ }).first().click());
await step("driver tab drive", () => page.getByRole("tab", { name: /Drive/ }).first().click());
await step("go offline", async () => { await btn("Go offline").click(); await page.getByRole("dialog").getByRole("button", { name: "Go offline" }).click(); });
await step("reload stays driver", async () => { await page.goto(BASE + "/", { waitUntil: "load" }); });
await step("account to commuter", async () => { await page.goto(BASE + "/account"); await page.getByText("Switch to commuter mode").click(); });
await step("log out", async () => { await page.goto(BASE + "/account"); await page.getByText(/Log out/).last().click(); });
await browser.close();
console.log(`screenshots: ${OUT}`);
