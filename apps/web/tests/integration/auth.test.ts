import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Set it in apps/web/.env.local or the root .env`);
  return value;
};

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const otp = requireEnv("SUPABASE_AUTH_TEST_OTP");
const client = () =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

describe("auth", () => {
  it("gives a guest an anonymous session", async () => {
    const { data, error } = await client().auth.signInAnonymously();
    expect(error).toBeNull();
    expect(data.user?.is_anonymous).toBe(true);
  });

  it("logs in a test number with the fixed code", async () => {
    const sb = client();
    const phone = "+639000000001";
    expect((await sb.auth.signInWithOtp({ phone })).error).toBeNull();
    const { data, error } = await sb.auth.verifyOtp({ phone, token: otp, type: "sms" });
    expect(error).toBeNull();
    expect(data.user?.phone).toBe("639000000001");
  });

  it("rejects a wrong code", async () => {
    const sb = client();
    const phone = "+639000000002";
    expect((await sb.auth.signInWithOtp({ phone })).error).toBeNull();
    const wrong = otp === "000000" ? "111111" : "000000";
    const { error } = await sb.auth.verifyOtp({ phone, token: wrong, type: "sms" });
    expect(error).not.toBeNull();
  });

  it("sends no code to numbers outside the test list", async () => {
    // 0900 prefix is unassigned, so this never texts a real person once SMS is enabled.
    const { error } = await client().auth.signInWithOtp({ phone: "+639000000099" });
    expect(error).not.toBeNull();
  });
});
