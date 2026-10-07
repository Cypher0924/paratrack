import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

describe("repo config", () => {
  it("keeps test OTP codes out of git", () => {
    const block = read("supabase/config.toml").split("[auth.sms.test_otp]")[1]!.split("\n[")[0]!;
    const values = [...block.matchAll(/^\s*\d+\s*=\s*"([^"]*)"/gm)].map((m) => m[1]);
    expect(values).toHaveLength(26);
    for (const v of values) expect(v).toBe("env(SUPABASE_AUTH_TEST_OTP)");
  });

  it("matches the Android package to the Firebase config", () => {
    const app = JSON.parse(read("apps/native/app.json")).expo;
    const gs = JSON.parse(read("apps/native/google-services.json"));
    const packages = gs.client.map((c: any) => c.client_info.android_client_info.package_name);
    expect(packages).toContain(app.android.package);
    expect(app.android.googleServicesFile).toBe("./google-services.json");
  });

  it("keeps the Android location setup the driver background task needs", () => {
    const app = JSON.parse(read("apps/native/app.json")).expo;
    expect(app.android.permissions).toContain("android.permission.RECEIVE_BOOT_COMPLETED");
    const loc = app.plugins.find((p: unknown) => Array.isArray(p) && p[0] === "expo-location");
    expect(loc[1].isAndroidBackgroundLocationEnabled).toBe(true);
    expect(loc[1].isAndroidForegroundServiceEnabled).toBe(true);
    // defineTask has to load at app start, not with a screen
    expect(read("apps/native/index.js")).toContain("@repo/ui/src/lib/locationTask");
  });
});
