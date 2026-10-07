import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { afterOffline, afterPing, afterSeats } from "../../lib/dispatch";

// Real rows on paratrack-dev, push sender stubbed. Anonymous users keep it clear of the test phone numbers.

const need = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}. Set it in apps/web/.env.local or the root .env`);
  return v;
};
const admin = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const guest = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ok = async <T>(q: PromiseLike<{ data: T; error: { message: string } | null }>) => {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as NonNullable<T>;
};

const LNG = 120.59;
const LAT0 = 15.47;
const LAT_END = 15.4745;
const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
const operatorId = crypto.randomUUID();
const routeId = crypto.randomUUID();
const vehicleId = crypto.randomUUID();
const otherVehicleId = crypto.randomUUID();
const stopIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
let userId = "";
let routeLength = 0;
let announcementId = 0;

const push = vi.fn(async () => {});
const deps = { push };
// Other test files insert announcements, and the trigger notifies every user, so skip those rows.
const notifications = async () =>
  (await ok(admin.from("notifications").select("kind, title, body, data").eq("user_id", userId).order("id"))).filter(
    (r) => !(r.data as { announcementId?: number }).announcementId,
  );
const reset = async () => {
  push.mockClear();
  await admin.from("notifications").delete().eq("user_id", userId);
  await admin.from("trips").delete().eq("user_id", userId);
};
const setLive = (id: string, v: Record<string, unknown>) => ok(admin.from("vehicle_live").update(v).eq("vehicle_id", id));
const addTrip = (t: Record<string, unknown>) =>
  ok(admin.from("trips").insert({ user_id: userId, vehicle_id: vehicleId, board_stop_id: stopIds[1], alight_stop_id: stopIds[2], ...t }).select("id").single());

beforeAll(async () => {
  const g = await guest.auth.signInAnonymously();
  if (g.error || !g.data.user) throw g.error ?? new Error("no user");
  userId = g.data.user.id;

  await ok(admin.from("operators").insert({ id: operatorId, name: "Dispatch test", code: `DSP-${suffix}` }));
  const route = await ok(
    admin
      .from("routes")
      .insert({
        id: routeId,
        name: `Dispatch route ${suffix}`,
        vehicle_type: "jeep",
        geom: `SRID=4326;LINESTRING(${LNG} ${LAT0}, ${LNG} ${LAT_END}, ${LNG} ${LAT0})`,
        base_fare: 13,
        base_km: 4,
        per_km: 1.8,
      })
      .select("length_m")
      .single(),
  );
  routeLength = route.length_m;
  await ok(
    admin.from("stops").insert([
      { id: stopIds[0], name: "Dispatch start", geom: `SRID=4326;POINT(${LNG} ${LAT0})` },
      { id: stopIds[1], name: "Dispatch middle", geom: `SRID=4326;POINT(${LNG} 15.47225)` },
      { id: stopIds[2], name: "Dispatch end", geom: `SRID=4326;POINT(${LNG} ${LAT_END})` },
    ]),
  );
  await ok(
    admin.from("route_stops").insert([
      { route_id: routeId, stop_id: stopIds[0], seq: 1, offset_m: 0 },
      { route_id: routeId, stop_id: stopIds[1], seq: 2, offset_m: routeLength / 4 },
      { route_id: routeId, stop_id: stopIds[2], seq: 3, offset_m: routeLength / 2 },
    ]),
  );
  await ok(
    admin.from("vehicles").insert([
      { id: vehicleId, operator_id: operatorId, route_id: routeId, label: "Test jeep 1", plate: `DSA ${suffix}`, capacity: 12 },
      { id: otherVehicleId, operator_id: operatorId, route_id: routeId, label: "Test jeep 2", plate: `DSB ${suffix}`, capacity: 12 },
    ]),
  );
  await ok(
    admin.from("vehicle_live").insert([
      { vehicle_id: vehicleId, online: true, lat: LAT0, lng: LNG, progress_m: 0, speed_mps: 5, seats_taken: 12 },
      { vehicle_id: otherVehicleId, online: true, lat: LAT0, lng: LNG, progress_m: routeLength - 100, speed_mps: 5, seats_taken: 2 },
    ]),
  );
});

afterAll(async () => {
  if (announcementId) {
    await admin.from("notifications").delete().eq("data->>announcementId", String(announcementId));
    await admin.from("announcements").delete().eq("id", announcementId);
  }
  await admin.from("vehicles").delete().in("id", [vehicleId, otherVehicleId]);
  await admin.from("routes").delete().eq("id", routeId);
  await admin.from("stops").delete().in("id", stopIds);
  await admin.from("operators").delete().eq("id", operatorId);
  if (userId) await admin.auth.admin.deleteUser(userId);
});

describe("afterPing", () => {
  it("sends one arrival alert per trip", async () => {
    await reset();
    await setLive(vehicleId, { progress_m: routeLength / 4 - 100, speed_mps: 5, seats_taken: 4 });
    const trip = await addTrip({ status: "tracking" });
    await afterPing(vehicleId, deps);
    const rows = await notifications();
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("arrival");
    expect(rows[0].title).toBe("Test jeep 1 is 1 min away");
    expect(rows[0].body).toContain("Head to Dispatch middle");
    expect(push).toHaveBeenCalledTimes(1);
    const t = await ok(admin.from("trips").select("arrival_sent_at").eq("id", trip.id).single());
    expect(t.arrival_sent_at).not.toBeNull();

    await afterPing(vehicleId, deps);
    expect(await notifications()).toHaveLength(1);
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("stays quiet when the vehicle is far away", async () => {
    await reset();
    await setLive(vehicleId, { progress_m: routeLength / 4 + 50 });
    await addTrip({ status: "tracking" });
    await afterPing(vehicleId, deps);
    expect(await notifications()).toHaveLength(0);
  });

  it("sends a Para alert once the vehicle passes the stop before the alight stop", async () => {
    await reset();
    await setLive(vehicleId, { progress_m: routeLength / 4 + 50 });
    await addTrip({ status: "onboard" });
    await afterPing(vehicleId, deps);
    await afterPing(vehicleId, deps);
    const rows = await notifications();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Your stop is next");
  });
});

describe("afterSeats", () => {
  it("tells trackers the vehicle is full and names the next one", async () => {
    await reset();
    await addTrip({ status: "tracking" });
    await addTrip({ status: "onboard" });
    await afterSeats(vehicleId, true, deps);
    const rows = await notifications();
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("service");
    expect(rows[0].title).toBe("Test jeep 1 is full");
    expect(rows[0].body).toContain("with seats reaches Dispatch middle in 2 min");
    expect(push).toHaveBeenCalledTimes(1);
    await afterSeats(vehicleId, true, deps);
    expect(await notifications()).toHaveLength(1);
  });

  it("does nothing when the vehicle did not become full", async () => {
    await reset();
    await addTrip({ status: "tracking" });
    await afterSeats(vehicleId, false, deps);
    expect(await notifications()).toHaveLength(0);
  });
});

describe("afterOffline", () => {
  it("tells trackers the driver stopped sharing", async () => {
    await reset();
    await addTrip({ status: "tracking" });
    await afterOffline(vehicleId, deps);
    const rows = await notifications();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Test jeep 1 stopped sharing");
    expect(push).toHaveBeenCalledTimes(1);
  });
});

describe("announcement trigger", () => {
  const announce = async (route_id: string | null) => {
    const a = await ok(admin.from("announcements").insert({ route_id, title: "Detour", body: "Road work on Rizal Ave." }).select("id").single());
    announcementId = a.id;
    const rows = await ok(admin.from("notifications").select("kind, title, body, data").eq("user_id", userId).eq("data->>announcementId", String(a.id)));
    await admin.from("notifications").delete().eq("data->>announcementId", String(a.id));
    await admin.from("announcements").delete().eq("id", a.id);
    announcementId = 0;
    return rows;
  };
  const saveRoute = (alerts: boolean) => admin.from("saved_routes").upsert({ user_id: userId, route_id: routeId, alerts });

  it("sends city-wide announcements to users with service updates on", async () => {
    await reset();
    const rows = await announce(null);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "service", title: "Detour", body: "Road work on Rizal Ave." });
    expect((rows[0].data as { url: string }).url).toMatch(/^\/alerts\/\d+$/);
  });

  it("sends route announcements only to users who saved the route with alerts on", async () => {
    await reset();
    await admin.from("saved_routes").delete().eq("user_id", userId);
    expect(await announce(routeId)).toHaveLength(0);
    await ok(saveRoute(false));
    expect(await announce(routeId)).toHaveLength(0);
    await ok(saveRoute(true));
    expect(await announce(routeId)).toHaveLength(1);
    await admin.from("saved_routes").delete().eq("user_id", userId);
  });
});

describe("trip history", () => {
  it("stamps boarded_at and ended_at when the status changes", async () => {
    await reset();
    const t = await addTrip({});
    await ok(guest.from("trips").update({ status: "onboard" }).eq("id", t.id));
    await ok(guest.from("trips").update({ status: "ended", feedback: ["on_time", "clean"] }).eq("id", t.id));
    const row = await ok(admin.from("trips").select("boarded_at, ended_at, feedback").eq("id", t.id).single());
    expect(row.boarded_at).toBeTruthy();
    expect(row.ended_at).toBeTruthy();
    expect(row.feedback).toEqual(["on_time", "clean"]);
    await expect(ok(guest.from("trips").update({ feedback: ["rude"] }).eq("id", t.id))).rejects.toThrow();
  });

  it("lets users report only their own trips", async () => {
    await reset();
    const mine = await addTrip({});
    const other = await ok(admin.from("trips").insert({ user_id: (await ok(admin.from("profiles").select("id").neq("id", userId).limit(1).single())).id, vehicle_id: vehicleId, board_stop_id: stopIds[1], alight_stop_id: stopIds[2] }).select("id").single());
    await ok(guest.from("reports").insert({ trip_id: mine.id, kind: "unsafe_driving", note: "Overtook on the curve" }));
    await expect(ok(guest.from("reports").insert({ trip_id: other.id, kind: "safety" }))).rejects.toThrow();
    const rows = await ok(guest.from("reports").select("kind, note"));
    expect(rows).toEqual([{ kind: "unsafe_driving", note: "Overtook on the curve" }]);
    await admin.from("trips").delete().eq("id", other.id);
  });
});
