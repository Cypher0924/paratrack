import { createClient } from "@supabase/supabase-js";
import type { Database } from "@repo/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as offline } from "../../app/api/driver/offline/route";
import { POST as ping } from "../../app/api/driver/ping/route";
import { POST as seats } from "../../app/api/driver/seats/route";

const need = (n: string) => {
  const v = process.env[n];
  if (!v) throw new Error(`Missing ${n}. Set it in apps/web/.env.local or the root .env`);
  return v;
};
const client = createClient<Database>(need("NEXT_PUBLIC_SUPABASE_URL"), need("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const call = (handler: (r: Request) => Promise<Response>, path: string, body: unknown, token?: string) =>
  handler(
    new Request(`http://localhost/api/driver/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    }),
  );

// A point on the Tarlac-Paniqui route (first vertex of the seeded line).
const fix = { lat: 15.496054, lng: 120.593772, speed: 4, heading: 90, accuracy: 8 };

// +639000000017 on NTM-6409 NPQ 8801: no other test, spec or the simulator uses this vehicle.
describe("driver API", () => {
  let token = "";
  let vehicleId = "";

  const live = async () =>
    (await client.from("vehicle_live").select("online, lat, lng, seats_taken, marked_full").eq("vehicle_id", vehicleId).single()).data;

  beforeAll(async () => {
    const phone = "+639000000017";
    expect((await client.auth.signInWithOtp({ phone })).error).toBeNull();
    const { data, error } = await client.auth.verifyOtp({ phone, token: need("SUPABASE_AUTH_TEST_OTP"), type: "sms" });
    expect(error).toBeNull();
    token = data.session!.access_token;
    const v = await client.rpc("verify_driver", { p_operator_code: "NTM-6409", p_plate: "NPQ 8801" });
    expect(v.error).toBeNull();
    vehicleId = (await client.from("drivers").select("vehicle_id").single()).data!.vehicle_id!;
  }, 40_000);

  afterAll(async () => {
    await client.rpc("end_shift"); // errors when already offline, which is fine
  });

  it("rejects a missing or bad token with 401", async () => {
    expect((await call(ping, "ping", fix)).status).toBe(401);
    expect((await call(ping, "ping", fix, "not-a-token")).status).toBe(401);
    expect((await call(seats, "seats", { count: 1 }, "not-a-token")).status).toBe(401);
    expect((await call(offline, "offline", {}, "not-a-token")).status).toBe(401);
  });

  it("rejects a bad body with 400", async () => {
    expect((await call(ping, "ping", { lat: 200, lng: 0, speed: null, heading: null, accuracy: null }, token)).status).toBe(400);
    expect((await call(ping, "ping", { lat: 1 }, token)).status).toBe(400);
    expect((await call(seats, "seats", {}, token)).status).toBe(400);
  });

  it("answers 409 while the driver is not online", async () => {
    await client.rpc("end_shift");
    const res = await call(ping, "ping", fix, token);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("not_online");
  });

  it("updates vehicle_live from a ping, seats and an offline call", async () => {
    expect((await client.rpc("start_shift")).error).toBeNull();

    const p = await call(ping, "ping", fix, token);
    expect(p.status).toBe(200);
    const row = await live();
    expect(row?.online).toBe(true);
    expect(row?.lat).toBeCloseTo(fix.lat, 5);
    expect(row?.lng).toBeCloseTo(fix.lng, 5);

    const s = await call(seats, "seats", { count: 3 }, token);
    expect(s.status).toBe(200);
    expect(await s.json()).toMatchObject({ seats_taken: 3, marked_full: false, is_full: false });
    const f = await call(seats, "seats", { full: true }, token);
    expect(await f.json()).toMatchObject({ marked_full: true, was_full: false, is_full: true });
    expect((await live())?.marked_full).toBe(true);

    const o = await call(offline, "offline", {}, token);
    expect(o.status).toBe(200);
    expect(await o.json()).toMatchObject({ vehicle_id: vehicleId, trackers: 0 });
    expect((await live())?.online).toBe(false);
  });
});
