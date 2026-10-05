import type { Client, LiveVehicle, LngLat, Route, RouteStop, Stop, VehicleLive } from "./types";
import { must } from "./types";

// operator_id is withheld from clients, so never select * on vehicles.
export const VEHICLE_COLUMNS = "id, route_id, label, plate, capacity";

type Point = { type: "Point"; coordinates: LngLat };
type Line = { type: "LineString"; coordinates: LngLat[] };

export const fetchLiveVehicles = async (client: Client): Promise<LiveVehicle[]> => {
  const rows = must(await client.from("vehicles").select(`${VEHICLE_COLUMNS}, vehicle_live(*)`));
  return rows.map(({ vehicle_live, ...v }) => ({
    ...v,
    live: (Array.isArray(vehicle_live) ? vehicle_live[0] : vehicle_live) ?? null,
  })) as LiveVehicle[];
};

export const fetchRoutes = async (client: Client): Promise<Route[]> => {
  const rows = must(await client.from("routes").select("*").eq("active", true).order("name"));
  return rows.map(({ geom, ...r }) => ({ ...r, path: (geom as Line | null)?.coordinates ?? [] }));
};

export const fetchStops = async (client: Client): Promise<Stop[]> => {
  const rows = must(await client.from("stops").select("id, name, geom").order("name"));
  return rows.map((s) => {
    const [lng, lat] = (s.geom as Point).coordinates;
    return { id: s.id, name: s.name, lat, lng };
  });
};

/** Every route's stops in order, joined with the stop rows. */
export const fetchRouteStops = async (client: Client): Promise<RouteStop[]> => {
  const [links, stops] = await Promise.all([
    client.from("route_stops").select("route_id, stop_id, seq, offset_m").order("seq").then(must),
    fetchStops(client),
  ]);
  const byId = new Map(stops.map((s) => [s.id, s]));
  return links.flatMap((l) => {
    const stop = byId.get(l.stop_id);
    return stop ? [{ routeId: l.route_id, seq: l.seq, offsetM: l.offset_m, stop }] : [];
  });
};

export const mergeLive = (vehicles: LiveVehicle[], row: VehicleLive): LiveVehicle[] =>
  vehicles.map((v) => (v.id === row.vehicle_id ? { ...v, live: row } : v));
