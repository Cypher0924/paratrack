import { expect, test } from "@playwright/test";
import { signIn } from "./support/auth";

// Pins the helper the screen tests rely on. +639000000020 is reserved for this check.
test("signIn puts a session the web app can read", async ({ browser }, info) => {
  test.skip(info.project.name !== "pixel", "one project is enough, and the number can only send every 5 s");
  const { user, storageState } = await signIn("+639000000020");
  expect(user.phone).toBe("639000000020");
  const context = await browser.newContext({ storageState });
  const p = await context.newPage();
  await p.goto("/");
  const stored = await p.evaluate(() => Object.keys(localStorage).filter((k) => k.endsWith("-auth-token")));
  expect(stored).toHaveLength(1);
  await context.close();
});
