import { etaSeconds, nearestStop, routesServing, seatStatus } from "@repo/core";
import type { FareType } from "@repo/core";
import { computeFare } from "./compute";
import type { LiveVehicle, Route, RouteStop } from "./types";

export type SearchResult = {
  route: Route;
  fromStopId: string;
  fareCentavos: number | null;
  /** Soonest vehicle with seats left, or null. */
  next: { etaSec: number; pickup: Date; arrive: Date; seatsLeft: number; status: "available" | "filling" } | null;
  /** True when vehicles are online but every one is full. */
  allFull: boolean;
};

// ponytail: fixed 6 m/s (about 22 km/h) ride speed for the arrival estimate. Use per-route speed if drivers report it.
const RIDE_MPS = 6;

export const computeSearch = (
  from: { stopId: string } | { position: { lat: number; lng: number } },
  toStopId: string,
  routes: Route[],
  routeStops: RouteStop[],
  vehicles: LiveVehicle[],
  fareType: FareType,
  now: Date,
): SearchResult[] => {
  const refs = routeStops.map((rs) => ({ routeId: rs.routeId, seq: rs.seq, stopId: rs.stop.id }));
  const fromId = "stopId" in from ? from.stopId : null;
  const ids = fromId
    ? routesServing(refs, fromId, toStopId)
    : [...new Set(routeStops.map((rs) => rs.routeId))];
  const out: SearchResult[] = [];
  for (const routeId of ids) {
    const route = routes.find((r) => r.id === routeId);
    const onRoute = routeStops.filter((rs) => rs.routeId === routeId);
    const dest = onRoute.find((rs) => rs.stop.id === toStopId);
    if (!route || !dest) continue;
    let fromRs: RouteStop | undefined;
    if (fromId) fromRs = onRoute.find((rs) => rs.stop.id === fromId);
    else {
      const before = onRoute.filter((rs) => rs.seq < dest.seq);
      const near = nearestStop("position" in from ? from.position : { lat: 0, lng: 0 }, before.map((rs) => ({ ...rs.stop, rs })));
      fromRs = near?.stop.rs;
    }
    if (!fromRs) continue;
    const fare = computeFare(route, routeStops, fromRs.stop.id, toStopId, fareType);
    const ride = ((fare?.distanceKm ?? 0) * 1000) / RIDE_MPS;
    let next: SearchResult["next"] = null;
    let online = 0;
    for (const v of vehicles) {
      if (v.route_id !== routeId || !v.live?.online) continue;
      online++;
      const seat = seatStatus({ capacity: v.capacity, seatsTaken: v.live.seats_taken, markedFull: v.live.marked_full });
      if (seat.status === "full") continue;
      const etaSec = etaSeconds({ progressM: v.live.progress_m, speedMps: v.live.speed_mps }, fromRs.offsetM, route.length_m);
      if (!next || etaSec < next.etaSec)
        next = { etaSec, pickup: new Date(now.getTime() + etaSec * 1000), arrive: new Date(now.getTime() + (etaSec + ride) * 1000), seatsLeft: seat.seatsLeft, status: seat.status };
    }
    out.push({ route, fromStopId: fromRs.stop.id, fareCentavos: fare?.breakdown.totalCentavos ?? null, next, allFull: online > 0 && !next });
  }
  return out.sort((a, b) => (a.next?.etaSec ?? Infinity) - (b.next?.etaSec ?? Infinity));
};
