import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  arrivalCopy,
  etaSeconds,
  fullCopy,
  paraCopy,
  seatStatus,
  shouldSendArrival,
  shouldSendPara,
  stoppedSharingCopy,
  type Database,
  type NotificationCopy,
} from "@repo/core";
import { pushToUser } from "./push";

type Admin = SupabaseClient<Database>;
export type PushFn = (userId: string, msg: { title: string; body: string; data?: Record<string, unknown> }) => Promise<void>;
/** Tests inject `admin` and `push`. Routes pass nothing. */
export type DispatchDeps = { admin?: Admin; push?: PushFn };

let cached: Admin | undefined;
export function adminClient(): Admin {
  cached ??= createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

const ctx = (deps: DispatchDeps) => {
  const admin = deps.admin ?? adminClient();
  return { admin, push: deps.push ?? ((userId, msg) => pushToUser(admin as unknown as SupabaseClient, userId, msg)) };
};

async function notify(
  c: ReturnType<typeof ctx>,
  userId: string,
  kind: "arrival" | "service",
  copy: NotificationCopy,
  data: Record<string, unknown>,
) {
  const payload = { url: "/alerts", ...data };
  await c.admin.from("notifications").insert({ user_id: userId, kind, title: copy.title, body: copy.body, data: payload as never });
  await c.push(userId, { ...copy, data: payload });
}

async function loadVehicle(admin: Admin, vehicleId: string) {
  const [{ data: vehicle }, { data: live }] = await Promise.all([
    admin.from("vehicles").select("id, label, route_id, capacity").eq("id", vehicleId).single(),
    admin.from("vehicle_live").select("progress_m, speed_mps, seats_taken, marked_full, online").eq("vehicle_id", vehicleId).single(),
  ]);
  if (!vehicle || !live || !vehicle.route_id) return null;
  const [{ data: route }, { data: rs }] = await Promise.all([
    admin.from("routes").select("name, length_m").eq("id", vehicle.route_id).single(),
    admin.from("route_stops").select("stop_id, seq, offset_m, stops(name)").eq("route_id", vehicle.route_id).order("seq"),
  ]);
  if (!route || !rs) return null;
  const stops = rs.map((r) => ({
    stopId: r.stop_id,
    seq: r.seq as number,
    offsetM: r.offset_m,
    name: (r.stops as unknown as { name: string | null } | null)?.name ?? "your stop",
  }));
  return { vehicle, live, route, stops };
}

const activeTrips = (admin: Admin, vehicleId: string, statuses: ("tracking" | "onboard")[]) =>
  admin
    .from("trips")
    .select("id, user_id, status, board_stop_id, alight_stop_id, arrival_alert, para_alert, arrival_sent_at, para_sent_at, full_sent_at")
    .eq("vehicle_id", vehicleId)
    .in("status", statuses);

/** Arrival alerts for trackers and Para alerts for riders. Each fires once per trip. */
export async function afterPing(vehicleId: string, deps: DispatchDeps = {}): Promise<void> {
  const c = ctx(deps);
  const v = await loadVehicle(c.admin, vehicleId);
  if (!v || !v.live.online) return;
  const { data: trips } = await activeTrips(c.admin, vehicleId, ["tracking", "onboard"]);
  if (!trips?.length) return;
  const { data: profiles } = await c.admin
    .from("profiles")
    .select("id, arrival_alerts, alert_minutes")
    .in("id", [...new Set(trips.map((t) => t.user_id))]);
  const prof = new Map((profiles ?? []).map((p) => [p.id, p]));
  const lengthM = v.route.length_m;
  const progressM = v.live.progress_m;
  const label = v.vehicle.label ?? "Your vehicle";
  const now = new Date();

  for (const t of trips) {
    const p = prof.get(t.user_id);
    if (t.status === "tracking" && p?.arrival_alerts) {
      const stop = v.stops.find((s) => s.stopId === t.board_stop_id);
      if (!stop) continue;
      const eta = etaSeconds({ progressM, speedMps: v.live.speed_mps }, stop.offsetM, lengthM);
      const trip = { status: t.status, arrivalAlert: t.arrival_alert, arrivalSentAt: t.arrival_sent_at, alertMinutes: p.alert_minutes };
      if (!shouldSendArrival(trip, eta)) continue;
      const { data: claimed } = await c.admin
        .from("trips")
        .update({ arrival_sent_at: now.toISOString() })
        .eq("id", t.id)
        .is("arrival_sent_at", null)
        .select("id");
      if (!claimed?.length) continue;
      const seats = seatStatus({ capacity: v.vehicle.capacity, seatsTaken: v.live.seats_taken, markedFull: v.live.marked_full });
      await notify(
        c,
        t.user_id,
        "arrival",
        arrivalCopy({
          vehicleLabel: label,
          minutes: Math.max(1, Math.ceil(eta / 60)),
          stopName: stop.name,
          arrivesAt: new Date(now.getTime() + eta * 1000),
          seatsLeft: seats.seatsLeft,
        }),
        { tripId: t.id, vehicleId },
      );
    } else if (t.status === "onboard") {
      const alight = v.stops.find((s) => s.stopId === t.alight_stop_id);
      if (!alight) continue;
      const prev = v.stops.find((s) => s.seq === alight.seq - 1) ?? v.stops[v.stops.length - 1];
      const trip = { status: t.status, paraAlert: t.para_alert, paraSentAt: t.para_sent_at };
      if (!shouldSendPara(trip, progressM, prev.offsetM, alight.offsetM, lengthM)) continue;
      const { data: claimed } = await c.admin
        .from("trips")
        .update({ para_sent_at: now.toISOString() })
        .eq("id", t.id)
        .is("para_sent_at", null)
        .select("id");
      if (!claimed?.length) continue;
      await notify(c, t.user_id, "arrival", paraCopy({ stopName: alight.name }), { tripId: t.id, vehicleId });
    }
  }
}

/** Tells trackers (not yet on board) the vehicle is full, naming the next one with seats. */
export async function afterSeats(vehicleId: string, becameFull: boolean, deps: DispatchDeps = {}): Promise<void> {
  if (!becameFull) return;
  const c = ctx(deps);
  const v = await loadVehicle(c.admin, vehicleId);
  if (!v) return;
  const { data: trips } = await activeTrips(c.admin, vehicleId, ["tracking"]);
  if (!trips?.length) return;

  const { data: others } = await c.admin.from("vehicles").select("id, label, capacity").eq("route_id", v.vehicle.route_id!).neq("id", vehicleId);
  const { data: otherLive } = others?.length
    ? await c.admin
        .from("vehicle_live")
        .select("vehicle_id, progress_m, speed_mps, seats_taken, marked_full, online")
        .in("vehicle_id", others.map((o) => o.id))
        .eq("online", true)
    : { data: [] };
  const free = (otherLive ?? []).flatMap((l) => {
    const o = others!.find((x) => x.id === l.vehicle_id)!;
    return seatStatus({ capacity: o.capacity, seatsTaken: l.seats_taken, markedFull: l.marked_full }).status === "full"
      ? []
      : [{ label: o.label, progressM: l.progress_m, speedMps: l.speed_mps }];
  });

  for (const t of trips) {
    const stop = v.stops.find((s) => s.stopId === t.board_stop_id);
    if (!stop) continue;
    const { data: claimed } = await c.admin
      .from("trips")
      .update({ full_sent_at: new Date().toISOString() })
      .eq("id", t.id)
      .is("full_sent_at", null)
      .select("id");
    if (!claimed?.length) continue;
    let next: { label: string | null; minutes: number } | null = null;
    for (const f of free) {
      const minutes = Math.max(1, Math.ceil(etaSeconds(f, stop.offsetM, v.route.length_m) / 60));
      if (!next || minutes < next.minutes) next = { label: f.label, minutes };
    }
    await notify(
      c,
      t.user_id,
      "service",
      fullCopy({
        vehicleLabel: v.vehicle.label ?? "Your vehicle",
        routeName: v.route.name ?? "this route",
        nextLabel: next?.label ?? null,
        stopName: stop.name,
        nextMinutes: next?.minutes ?? null,
      }),
      { tripId: t.id, vehicleId },
    );
  }
}

/** Tells trackers and riders the driver stopped sharing. */
export async function afterOffline(vehicleId: string, deps: DispatchDeps = {}): Promise<void> {
  const c = ctx(deps);
  const [{ data: vehicle }, { data: trips }] = await Promise.all([
    c.admin.from("vehicles").select("label, routes(name)").eq("id", vehicleId).single(),
    activeTrips(c.admin, vehicleId, ["tracking", "onboard"]),
  ]);
  if (!vehicle || !trips?.length) return;
  const copy = stoppedSharingCopy({
    vehicleLabel: vehicle.label ?? "Your vehicle",
    routeName: (vehicle.routes as unknown as { name: string | null } | null)?.name ?? "this route",
  });
  for (const t of trips) await notify(c, t.user_id, "service", copy, { tripId: t.id, vehicleId });
}
