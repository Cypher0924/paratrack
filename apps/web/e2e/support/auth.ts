import { existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@repo/core";

// Local runs read the same env files as Vitest. CI sets the variables, and those win.
for (const f of ["../../.env.local", "../../../../.env"]) {
  const p = path.resolve(__dirname, f);
  if (existsSync(p)) process.loadEnvFile(p);
}

const need = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
};

/**
 * Signs a test number in with the test OTP, outside the browser.
 * Returns the signed-in client (for RPCs such as driver pings) and Playwright storage state that
 * puts the same session in the web app's localStorage: `test.use({ storageState })` or `browser.newContext({ storageState })`.
 */
export async function signIn(phone: string, baseURL = "http://localhost:3000") {
  const items: Record<string, string> = {};
  const client = createClient<Database>(need("NEXT_PUBLIC_SUPABASE_URL"), need("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    auth: {
      autoRefreshToken: false,
      storage: {
        getItem: (k) => items[k] ?? null,
        setItem: (k, v) => void (items[k] = v),
        removeItem: (k) => void delete items[k],
      },
    },
  });
  const sent = await client.auth.signInWithOtp({ phone });
  if (sent.error) throw sent.error;
  const verified = await client.auth.verifyOtp({ phone, token: need("SUPABASE_AUTH_TEST_OTP"), type: "sms" });
  if (verified.error) throw verified.error;
  const storageState = {
    cookies: [],
    origins: [{ origin: baseURL, localStorage: Object.entries(items).map(([name, value]) => ({ name, value })) }],
  };
  return { client, user: verified.data.user!, storageState };
}
