import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DELETE, POST } from "../../app/api/push/subscribe/route";

const need = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}. Set it in apps/web/.env.local or the root .env`);
  return v;
};
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SECRET_KEY"), opts);
const guest = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), opts);

let token = "";
let userId = "";
const call = (fn: typeof POST, body: unknown, auth?: string) =>
  fn(
    new Request("http://localhost/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json", ...(auth ? { authorization: `Bearer ${auth}` } : {}) },
      body: JSON.stringify(body),
    }),
  );
const rows = async () => (await admin.from("push_subscriptions").select("kind, token, keys").eq("user_id", userId)).data ?? [];

const web = { kind: "web", endpoint: "https://push.example.com/abc", keys: { p256dh: "p", auth: "a" } };
const expo = { kind: "expo", token: "ExponentPushToken[abc123]" };

beforeAll(async () => {
  const g = await guest.auth.signInAnonymously();
  if (g.error || !g.data.session) throw g.error ?? new Error("no session");
  token = g.data.session.access_token;
  userId = g.data.user!.id;
});

afterAll(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId);
});

describe("/api/push/subscribe", () => {
  it("returns 401 without a token", async () => {
    expect((await call(POST, web)).status).toBe(401);
    expect((await call(POST, web, "garbage")).status).toBe(401);
    expect((await call(DELETE, { kind: "web", token: web.endpoint })).status).toBe(401);
  });

  it("returns 400 on a bad body", async () => {
    expect((await call(POST, { kind: "web", endpoint: "http://insecure.example.com", keys: {} }, token)).status).toBe(400);
    expect((await call(POST, { kind: "expo", token: "nope" }, token)).status).toBe(400);
    expect((await call(POST, null, token)).status).toBe(400);
  });

  it("upserts web and expo targets, then deletes one", async () => {
    expect((await call(POST, web, token)).status).toBe(200);
    expect((await call(POST, web, token)).status).toBe(200);
    expect((await call(POST, expo, token)).status).toBe(200);
    const all = await rows();
    expect(all).toHaveLength(2);
    expect(all.find((r) => r.kind === "web")).toMatchObject({ token: web.endpoint, keys: web.keys });

    expect((await call(DELETE, { kind: "expo", token: expo.token }, token)).status).toBe(200);
    expect((await rows()).map((r) => r.kind)).toEqual(["web"]);
  });
});
