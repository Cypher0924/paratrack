import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@repo/core";
import { checkCode, fetchProfile, sendCode, updateProfile } from "./auth";
import { computeFare, computeNearby } from "./compute";
import { fetchNotifications, markAllRead, unreadCount } from "./notifications";
import { VEHICLE_COLUMNS, fetchLiveVehicles, fetchRouteStops, fetchRoutes, fetchStops } from "./queries";
import { endTrip, fetchActiveTrips, setOnboard, setTripAlerts, startTrip } from "./trips";
import type { Client } from "./types";

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Set it in apps/web/.env.local or the root .env`);
  return value;
};

const newClient = (): Client =>
  createClient<Database>(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

describe("public reads (seeded Tarlac data)", () => {
  const client = newClient();

  it("returns all 16 vehicles with explicit columns and no operator_id", async () => {
    const vehicles = await fetchLiveVehicles(client);
    expect(vehicles).toHaveLength(16);
    for (const v of vehicles) {
      expect(Object.keys(v).sort()).toEqual([...VEHICLE_COLUMNS.split(", "), "live"].sort());
      expect(v.live).not.toBeNull();
      expect(v.live?.online).toBe(false);
    }
  });

  it("loads routes with paths, 27 stops and ordered route stops", async () => {
    const [routes, stops, routeStops] = await Promise.all([fetchRoutes(client), fetchStops(client), fetchRouteStops(client)]);
    expect(routes).toHaveLength(7);
    expect(routes.every((r) => r.path.length > 1)).toBe(true);
    expect(stops).toHaveLength(27);
    expect(stops.every((s) => s.lat > 15 && s.lat < 16 && s.lng > 120 && s.lng < 121)).toBe(true);
    expect(routeStops.length).toBeGreaterThan(0);
  });

  it("computes nearby rows and fares from the seed", async () => {
    const [routes, routeStops, vehicles] = await Promise.all([fetchRoutes(client), fetchRouteStops(client), fetchLiveVehicles(client)]);
    const route = routes[0]!;
    const stops = routeStops.filter((rs) => rs.routeId === route.id);
    const here = stops[0]!.stop;
    // all seeded vehicles are offline, so no rows
    expect(computeNearby(here, routes, routeStops, vehicles)).toEqual([]);
    const online = vehicles.map((v) => (v.route_id === route.id && v.live ? { ...v, live: { ...v.live, online: true, progress_m: 0, speed_mps: 5 } } : v));
    const rows = computeNearby(here, routes, routeStops, online);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]!.walkMin).toBe(0);
    expect(rows.map((r) => r.etaSec)).toEqual([...rows.map((r) => r.etaSec)].sort((a, b) => a - b));

    const last = stops[stops.length - 1]!;
    const f = computeFare(route, routeStops, stops[0]!.stop.id, last.stop.id, "student");
    expect(f?.distanceKm).toBeGreaterThan(0);
    expect(f?.breakdown.totalCentavos).toBeGreaterThan(0);
    expect(computeFare(route, routeStops, "missing", last.stop.id, "regular")).toBeNull();
  });
});

describe("signed-in flow", () => {
  it("logs in, edits the profile, runs a trip and reads notifications", async () => {
    const client = newClient();
    const phone = "+639000000005";
    expect(await sendCode(client, phone)).toBeNull();
    const { session, error } = await checkCode(client, phone, requireEnv("SUPABASE_AUTH_TEST_OTP"));
    expect(error).toBeNull();
    const userId = session!.user.id;

    const profile = await updateProfile(client, userId, { fare_type: "student" });
    expect(profile.fare_type).toBe("student");
    expect((await fetchProfile(client, userId)).fare_type).toBe("student");

    const [vehicles, routeStops] = await Promise.all([fetchLiveVehicles(client), fetchRouteStops(client)]);
    const vehicle = vehicles[0]!;
    const stops = routeStops.filter((rs) => rs.routeId === vehicle.route_id);
    const trip = await startTrip(client, { vehicleId: vehicle.id, boardStopId: stops[0]!.stop.id, alightStopId: stops[1]!.stop.id });
    expect(trip.status).toBe("tracking");
    expect((await fetchActiveTrips(client)).map((t) => t.id)).toContain(trip.id);
    expect((await setTripAlerts(client, trip.id, { paraAlert: false })).para_alert).toBe(false);
    expect((await setOnboard(client, trip.id)).status).toBe("onboard");
    expect((await endTrip(client, trip.id)).status).toBe("ended");
    expect((await fetchActiveTrips(client)).map((t) => t.id)).not.toContain(trip.id);

    await markAllRead(client);
    expect(unreadCount(await fetchNotifications(client))).toBe(0);
  });
});
