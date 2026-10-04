import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// One file, so each test phone number signs in once per run (hosted OTP resend limit is ~60 s).
// Tests run in order: the driver flow builds on earlier steps.

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value)
    throw new Error(
      `Missing ${name}. Set it in apps/web/.env.local or the root .env`,
    );
  return value;
};

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const secret = requireEnv("SUPABASE_SECRET_KEY");
const otp = requireEnv("SUPABASE_AUTH_TEST_OTP");
const client = (apiKey = key) =>
  createClient(url, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const admin = client(secret);
const anon = client();
const commuter = client();
const driverA = client();
const driverB = client();

type Result<T> = { data: T; error: { message: string } | null };
const ok = async <T>(query: PromiseLike<Result<T>>) => {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as NonNullable<T>;
};
const fails = async (query: PromiseLike<Result<unknown>>) =>
  (await query).error?.message;
const DENIED = /permission denied/;

const signInPhone = async (sb: ReturnType<typeof client>, phone: string) => {
  const sent = await sb.auth.signInWithOtp({ phone });
  if (sent.error) throw sent.error;
  const { data, error } = await sb.auth.verifyOtp({
    phone,
    token: otp,
    type: "sms",
  });
  if (error || !data.user) throw error ?? new Error(`No user for ${phone}`);
  return data.user.id;
};

// A 1 km loop: 500 m north from (15.47, 120.59) and back on the same line.
const LNG = 120.59;
const LAT0 = 15.47;
const LAT_END = 15.4745;
const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
const code = `TEST-${suffix}`;
const plate = `TST ${suffix}`;
const operatorId = crypto.randomUUID();
const routeId = crypto.randomUUID();
const vehicleId = crypto.randomUUID();
const stopIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
const offRouteStopId = crypto.randomUUID();
const OFFLINE = {
  online: false,
  lat: null,
  lng: null,
  heading: null,
  accuracy: null,
  speed_mps: 0,
  progress_m: 0,
};
const liveRow = (sb: ReturnType<typeof client>) =>
  ok(
    sb
      .from("vehicle_live")
      .select("online, lat, lng, heading, accuracy, speed_mps, progress_m")
      .eq("vehicle_id", vehicleId)
      .single(),
  );
let routeLength = 0;
let commuterId = "";
let driverAId = "";
let driverBId = "";

beforeAll(async () => {
  driverAId = await signInPhone(driverA, "+639000000003");
  driverBId = await signInPhone(driverB, "+639000000004");
  const guest = await commuter.auth.signInAnonymously();
  if (guest.error || !guest.data.user)
    throw guest.error ?? new Error("No anonymous user");
  commuterId = guest.data.user.id;

  // Leftovers from an aborted run would trip the rate limit or the driver checks.
  await ok(
    admin
      .from("driver_verify_attempts")
      .delete()
      .in("user_id", [driverAId, driverBId]),
  );
  await ok(
    admin.from("drivers").delete().in("user_id", [driverAId, driverBId]),
  );

  await ok(
    admin
      .from("operators")
      .insert({ id: operatorId, name: "Test operator", code }),
  );
  const route = await ok(
    admin
      .from("routes")
      .insert({
        id: routeId,
        name: `Test route ${suffix}`,
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
      {
        id: stopIds[0],
        name: "Test start",
        geom: `SRID=4326;POINT(${LNG} ${LAT0})`,
      },
      {
        id: stopIds[1],
        name: "Test middle",
        geom: `SRID=4326;POINT(${LNG} 15.47225)`,
      },
      {
        id: stopIds[2],
        name: "Test end",
        geom: `SRID=4326;POINT(${LNG} ${LAT_END})`,
      },
      {
        id: offRouteStopId,
        name: "Test elsewhere",
        geom: `SRID=4326;POINT(120.6 ${LAT0})`,
      },
    ]),
  );
  await ok(
    admin.from("route_stops").insert([
      { route_id: routeId, stop_id: stopIds[0], seq: 1, offset_m: 0 },
      {
        route_id: routeId,
        stop_id: stopIds[1],
        seq: 2,
        offset_m: routeLength / 4,
      },
      {
        route_id: routeId,
        stop_id: stopIds[2],
        seq: 3,
        offset_m: routeLength / 2,
      },
    ]),
  );
  await ok(
    admin.from("vehicles").insert({
      id: vehicleId,
      operator_id: operatorId,
      route_id: routeId,
      label: "Test jeep",
      plate,
      capacity: 12,
    }),
  );
  // Offline, like the seed's rows. The location must not stick.
  await ok(
    admin.from("vehicle_live").insert({
      vehicle_id: vehicleId,
      lat: LAT0,
      lng: LNG,
      heading: 90,
      accuracy: 5,
      speed_mps: 4,
      progress_m: 10,
    }),
  );
  await ok(
    admin
      .from("announcements")
      .insert({ route_id: routeId, title: "Test", body: "Test body" }),
  );
});

afterAll(async () => {
  // Cascades remove vehicle_live, drivers, trips, route_stops and announcements.
  await admin.from("vehicles").delete().eq("id", vehicleId);
  await admin.from("routes").delete().eq("id", routeId);
  await admin
    .from("stops")
    .delete()
    .in("id", [...stopIds, offRouteStopId]);
  await admin.from("operators").delete().eq("id", operatorId);
  await admin
    .from("driver_verify_attempts")
    .delete()
    .in("user_id", [driverAId, driverBId]);
  if (commuterId) await admin.auth.admin.deleteUser(commuterId);
});

describe("schema", () => {
  it("sets the route length from its geometry", () => {
    expect(routeLength).toBeGreaterThan(990);
    expect(routeLength).toBeLessThan(1000);
  });

  it("creates a profile for every new user, guests included", async () => {
    const { data } = await admin
      .from("profiles")
      .select("id, fare_type, alert_minutes")
      .eq("id", commuterId);
    expect(data).toEqual([
      { id: commuterId, fare_type: "regular", alert_minutes: 2 },
    ]);
  });
});

describe("RLS", () => {
  it("lets anyone read routes, stops, route stops and announcements, but not write them", async () => {
    for (const sb of [anon, commuter]) {
      expect(
        await ok(sb.from("routes").select("id").eq("id", routeId)),
      ).toHaveLength(1);
      expect(
        await ok(sb.from("stops").select("id").in("id", stopIds)),
      ).toHaveLength(3);
      expect(
        await ok(sb.from("route_stops").select("seq").eq("route_id", routeId)),
      ).toHaveLength(3);
      expect(
        await ok(sb.from("announcements").select("id").eq("route_id", routeId)),
      ).toHaveLength(1);
      expect(await fails(sb.from("stops").insert({ name: "Nope" }))).toMatch(
        DENIED,
      );
    }
  });

  it("shows offline vehicles without a location", async () => {
    for (const sb of [anon, commuter]) {
      expect(await liveRow(sb)).toEqual(OFFLINE);
    }
  });

  it("has no driver column on vehicle_live for anyone to select", async () => {
    for (const sb of [anon, commuter, admin]) {
      expect(await fails(sb.from("vehicle_live").select("driver_id"))).toMatch(
        /does not exist/,
      );
    }
  });

  it("shows vehicles without their operator", async () => {
    for (const sb of [anon, commuter]) {
      const rows = await ok(
        sb
          .from("vehicles")
          .select("id, route_id, label, plate, capacity")
          .eq("id", vehicleId),
      );
      expect(rows).toEqual([
        {
          id: vehicleId,
          route_id: routeId,
          label: "Test jeep",
          plate,
          capacity: 12,
        },
      ]);
      expect(await fails(sb.from("vehicles").select("operator_id"))).toMatch(
        DENIED,
      );
    }
  });

  it("hides operators and verify attempts from every client", async () => {
    for (const sb of [anon, commuter, driverA]) {
      expect(await fails(sb.from("operators").select("id"))).toMatch(DENIED);
      expect(
        await fails(sb.from("driver_verify_attempts").select("id")),
      ).toMatch(DENIED);
    }
  });

  it("lets users read and update only their own profile", async () => {
    expect(await fails(anon.from("profiles").select("id"))).toMatch(DENIED);
    expect(await ok(commuter.from("profiles").select("id"))).toEqual([
      { id: commuterId },
    ]);
    const own = await ok(
      commuter
        .from("profiles")
        .update({ fare_type: "student" })
        .eq("id", commuterId)
        .select("fare_type"),
    );
    expect(own).toEqual([{ fare_type: "student" }]);
    const other = await ok(
      commuter
        .from("profiles")
        .update({ display_name: "Nope" })
        .eq("id", driverAId)
        .select("id"),
    );
    expect(other).toEqual([]);
  });

  it("gives owners full CRUD on trips, saved places, saved routes and push subscriptions", async () => {
    const cases: {
      table: string;
      row: Record<string, unknown>;
      change: Record<string, unknown>;
    }[] = [
      {
        table: "trips",
        row: {
          vehicle_id: vehicleId,
          board_stop_id: stopIds[0],
          alight_stop_id: stopIds[2],
        },
        change: { status: "onboard" },
      },
      {
        table: "saved_places",
        row: { label: "Home", stop_id: stopIds[0] },
        change: { label: "Work" },
      },
      {
        table: "saved_routes",
        row: { route_id: routeId },
        change: { route_id: routeId },
      },
      {
        table: "push_subscriptions",
        row: { kind: "web", token: `test-${suffix}` },
        change: { keys: { p256dh: "test" } },
      },
    ];
    for (const { table, row, change } of cases) {
      const created = await ok(
        commuter.from(table).insert(row).select().single(),
      );
      expect(created.user_id).toBe(commuterId);
      const match =
        table === "saved_routes"
          ? { user_id: commuterId, route_id: routeId }
          : { id: created.id };

      expect(await ok(commuter.from(table).select().match(match))).toHaveLength(
        1,
      );
      expect(
        await ok(commuter.from(table).update(change).match(match).select()),
      ).toHaveLength(1);
      expect(await ok(driverB.from(table).select().match(match))).toHaveLength(
        0,
      );
      expect(
        await ok(driverB.from(table).update(change).match(match).select()),
      ).toHaveLength(0);
      expect(
        await ok(driverB.from(table).delete().match(match).select()),
      ).toHaveLength(0);
      expect(
        await fails(
          driverB.from(table).insert({ ...row, user_id: commuterId }),
        ),
      ).toMatch(/row-level security/);
      expect(await fails(anon.from(table).select())).toMatch(DENIED);
      expect(
        await ok(commuter.from(table).delete().match(match).select()),
      ).toHaveLength(1);
    }
  });

  it("lets users read their notifications and only mark them read", async () => {
    const { id } = await ok(
      admin
        .from("notifications")
        .insert({
          user_id: commuterId,
          kind: "service",
          title: "Test",
          body: "Test body",
        })
        .select("id")
        .single(),
    );
    expect(await fails(anon.from("notifications").select("id"))).toMatch(
      DENIED,
    );
    expect(
      await ok(commuter.from("notifications").select("id").eq("id", id)),
    ).toHaveLength(1);
    expect(
      await ok(driverB.from("notifications").select("id").eq("id", id)),
    ).toHaveLength(0);

    const read = await ok(
      commuter
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .select("read_at"),
    );
    expect(read[0].read_at).not.toBeNull();
    expect(
      await fails(
        commuter.from("notifications").update({ title: "Nope" }).eq("id", id),
      ),
    ).toMatch(DENIED);
    expect(
      await fails(
        commuter
          .from("notifications")
          .insert({ user_id: commuterId, kind: "service", title: "Nope" }),
      ),
    ).toMatch(DENIED);
    expect(
      await fails(commuter.from("notifications").delete().eq("id", id)),
    ).toMatch(DENIED);
  });
});

describe("driver functions", () => {
  const ping = (lat: number, lng = LNG, speed: number | null = 10) =>
    driverA.rpc("driver_ping", {
      p_lat: lat,
      p_lng: lng,
      p_speed: speed,
      p_heading: 0,
      p_accuracy: 5,
    });

  it("are closed to signed-out clients", async () => {
    expect(await fails(anon.rpc("start_shift"))).toMatch(DENIED);
    expect(
      await fails(anon.rpc("tracking_count", { p_vehicle_id: vehicleId })),
    ).toMatch(DENIED);
  });

  it("require a phone number to verify", async () => {
    expect(
      await fails(
        commuter.rpc("verify_driver", {
          p_operator_code: code,
          p_plate: plate,
        }),
      ),
    ).toBe("phone_required");
  });

  it("refuse users who are not verified or not online", async () => {
    expect(await fails(driverB.rpc("start_shift"))).toBe("not_a_driver");
    expect(
      await fails(driverB.rpc("driver_ping", { p_lat: LAT0, p_lng: LNG })),
    ).toBe("not_online");
    expect(await fails(driverB.rpc("driver_set_seats", { p_count: 1 }))).toBe(
      "not_online",
    );
    expect(await fails(driverB.rpc("end_shift"))).toBe("not_a_driver");
  });

  it("record a failed attempt for a wrong code or plate", async () => {
    expect(
      await fails(
        driverA.rpc("verify_driver", {
          p_operator_code: code,
          p_plate: "NOPE 000",
        }),
      ),
    ).toBe("invalid_code_or_plate");
    expect(
      await fails(
        driverA.rpc("verify_driver", {
          p_operator_code: "NOPE",
          p_plate: plate,
        }),
      ),
    ).toBe("invalid_code_or_plate");
    const { count } = await admin
      .from("driver_verify_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", driverAId);
    expect(count).toBe(2);
  });

  it("stop verifying after five failed attempts in an hour", async () => {
    await ok(
      admin
        .from("driver_verify_attempts")
        .insert(Array(5).fill({ user_id: driverAId })),
    );
    expect(
      await fails(
        driverA.rpc("verify_driver", { p_operator_code: code, p_plate: plate }),
      ),
    ).toBe("too_many_attempts");
    await ok(
      admin.from("driver_verify_attempts").delete().eq("user_id", driverAId),
    );
  });

  it("verify a driver with the operator code and a loosely typed plate", async () => {
    const vehicle = await ok(
      driverA.rpc("verify_driver", {
        p_operator_code: code,
        p_plate: `tst-${suffix.toLowerCase()}`,
      }),
    );
    expect(vehicle).toEqual({
      vehicle_id: vehicleId,
      label: "Test jeep",
      plate,
      capacity: 12,
      route_id: routeId,
      route_name: `Test route ${suffix}`,
    });
    expect(await ok(driverA.from("drivers").select("vehicle_id"))).toEqual([
      { vehicle_id: vehicleId },
    ]);
    expect(await ok(commuter.from("drivers").select("vehicle_id"))).toEqual([]);
    expect(await fails(anon.from("drivers").select("vehicle_id"))).toMatch(
      DENIED,
    );
  });

  it("start a shift and show the vehicle to everyone", async () => {
    const live = await ok(driverA.rpc("start_shift"));
    expect(live).toMatchObject({
      vehicle_id: vehicleId,
      online: true,
      seats_taken: 0,
    });
    expect(await liveRow(anon)).toMatchObject({ online: true });
    expect(
      await fails(
        commuter
          .from("vehicle_live")
          .update({ seats_taken: 5 })
          .eq("vehicle_id", vehicleId),
      ),
    ).toMatch(DENIED);
  });

  it("reject a ping outside the lat/lng range", async () => {
    expect(await fails(ping(91))).toBe("invalid_point");
  });

  it("move progress forward along the loop, back leg included", async () => {
    const at = (fraction: number) => fraction * routeLength;
    const p1 = await ok(ping(15.4711));
    expect(p1).toMatchObject({
      vehicle_id: vehicleId,
      route_id: routeId,
      on_route: true,
      speed_mps: 3,
    });
    expect(Math.abs(p1.progress_m - at(0.0011 / 0.009))).toBeLessThan(3);
    const p2 = await ok(ping(15.4722));
    expect(Math.abs(p2.progress_m - at(0.0022 / 0.009))).toBeLessThan(3);
    expect(p2.speed_mps).toBeCloseTo(5.1, 3);
    const p3 = await ok(ping(LAT_END));
    expect(Math.abs(p3.progress_m - at(0.5))).toBeLessThan(3);
    // Same spot as p2, but the vehicle is now on the way back.
    const p4 = await ok(ping(15.4722, LNG, null));
    expect(Math.abs(p4.progress_m - at(1 - 0.0022 / 0.009))).toBeLessThan(3);
    expect(p4.speed_mps).toBeGreaterThan(0);
    expect(p4.speed_mps).toBeLessThanOrEqual(40);
    const off = await ok(ping(LAT0, 120.6));
    expect(off).toMatchObject({ on_route: false, progress_m: p4.progress_m });
  });

  it("clamp seats to capacity and report when the vehicle fills", async () => {
    const seats = (args: { p_count?: number; p_full?: boolean }) =>
      ok(driverA.rpc("driver_set_seats", args));
    expect(await seats({ p_count: 99 })).toEqual({
      seats_taken: 12,
      capacity: 12,
      marked_full: false,
      was_full: false,
      is_full: true,
    });
    expect(await seats({ p_count: 3 })).toMatchObject({
      seats_taken: 3,
      was_full: true,
      is_full: false,
    });
    expect(await seats({ p_full: true })).toMatchObject({
      seats_taken: 3,
      marked_full: true,
      is_full: true,
    });
    expect(await seats({ p_count: -5, p_full: false })).toMatchObject({
      seats_taken: 0,
      is_full: false,
    });
  });

  it("reject trip stops that are not on the vehicle's route, and count trackers", async () => {
    expect(
      await fails(
        commuter.from("trips").insert({
          vehicle_id: vehicleId,
          board_stop_id: offRouteStopId,
          alight_stop_id: stopIds[2],
        }),
      ),
    ).toBe("stop_not_on_route");
    await ok(
      commuter.from("trips").insert({
        vehicle_id: vehicleId,
        board_stop_id: stopIds[0],
        alight_stop_id: stopIds[2],
      }),
    );
    expect(
      await ok(driverB.rpc("tracking_count", { p_vehicle_id: vehicleId })),
    ).toBe(1);
  });

  it("refuse a second driver while the vehicle is online", async () => {
    expect(
      await fails(
        driverB.rpc("verify_driver", { p_operator_code: code, p_plate: plate }),
      ),
    ).toBe("vehicle_in_use");
  });

  it("end the shift with the tracker count and clear the location", async () => {
    expect(await ok(driverA.rpc("end_shift"))).toEqual({
      vehicle_id: vehicleId,
      trackers: 1,
    });
    expect(await liveRow(anon)).toEqual(OFFLINE);
  });
});

describe("stale-vehicles cron job", () => {
  const minutesAgo = (minutes: number) =>
    new Date(Date.now() - minutes * 60_000).toISOString();
  const setLive = (updatedAt: string) =>
    ok(
      admin
        .from("vehicle_live")
        .update({ online: true, lat: LAT0, lng: LNG, updated_at: updatedAt })
        .eq("vehicle_id", vehicleId),
    );

  it("takes vehicles silent for 5 minutes offline and clears the location", async () => {
    await setLive(minutesAgo(4));
    await ok(admin.rpc("run_cron_job", { p_name: "stale-vehicles" }));
    expect(await liveRow(admin)).toMatchObject({ online: true, lat: LAT0 });
    await setLive(minutesAgo(6));
    await ok(admin.rpc("run_cron_job", { p_name: "stale-vehicles" }));
    expect(await liveRow(anon)).toEqual(OFFLINE);
  });

  it("lets the driver end a shift the job already ended", async () => {
    expect(await ok(driverA.rpc("end_shift"))).toEqual({
      vehicle_id: vehicleId,
      trackers: 1,
    });
  });

  it("runs only scheduled jobs, for admins only", async () => {
    expect(await fails(admin.rpc("run_cron_job", { p_name: "missing" }))).toBe(
      "no_such_job",
    );
    expect(
      await fails(commuter.rpc("run_cron_job", { p_name: "stale-vehicles" })),
    ).toMatch(DENIED);
  });
});
