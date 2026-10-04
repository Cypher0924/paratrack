import { etaSeconds, fare, legDistanceKm, nearestStop, seatStatus, walkMinutes } from "@repo/core";
import type { FareBreakdown, FareType } from "@repo/core";
import type { LiveVehicle, Route, RouteStop, Stop } from "./types";

export type NearbyRow = {
  vehicle: LiveVehicle;
  route: Route;
  stop: Stop;
  etaSec: number;
  walkMin: number;
  seat: ReturnType<typeof seatStatus>;
};

/** Per route: nearest stop to the position, then each online vehicle's ETA to it. Soonest first. */
export const computeNearby = (
  position: { lat: number; lng: number } | null,
  routes: Route[],
  routeStops: RouteStop[],
  vehicles: LiveVehicle[],
): NearbyRow[] => {
  if (!position) return [];
  const rows: NearbyRow[] = [];
  for (const route of routes) {
    const onRoute = routeStops.filter((rs) => rs.routeId === route.id);
    const near = nearestStop(position, onRoute.map((rs) => ({ ...rs.stop, offsetM: rs.offsetM })));
    if (!near) continue;
    const walkMin = walkMinutes(near.distanceM);
    const { offsetM, ...stop } = near.stop;
    for (const vehicle of vehicles) {
      const live = vehicle.live;
      if (vehicle.route_id !== route.id || !live?.online) continue;
      rows.push({
        vehicle,
        route,
        stop,
        etaSec: etaSeconds({ progressM: live.progress_m, speedMps: live.speed_mps }, offsetM, route.length_m),
        walkMin,
        seat: seatStatus({ capacity: vehicle.capacity, seatsTaken: live.seats_taken, markedFull: live.marked_full }),
      });
    }
  }
  return rows.sort((a, b) => a.etaSec - b.etaSec);
};

export const computeFare = (
  route: Route | undefined,
  routeStops: RouteStop[],
  fromStopId: string,
  toStopId: string,
  fareType: FareType,
): { distanceKm: number; breakdown: FareBreakdown } | null => {
  if (!route || route.base_fare === null || route.base_km === null || route.per_km === null) return null;
  const from = routeStops.find((rs) => rs.routeId === route.id && rs.stop.id === fromStopId);
  const to = routeStops.find((rs) => rs.routeId === route.id && rs.stop.id === toStopId);
  if (!from || !to) return null;
  const distanceKm = legDistanceKm(from.offsetM, to.offsetM, route.length_m);
  return { distanceKm, breakdown: fare({ baseFare: route.base_fare, baseKm: route.base_km, perKm: route.per_km }, distanceKm, fareType) };
};
