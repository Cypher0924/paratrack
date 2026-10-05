import type { Client, VehicleLive } from "./types";
import { must } from "./types";
import type { Database } from "@repo/core";

export type DriverVehicle = {
  id: string;
  label: string | null;
  plate: string | null;
  capacity: number;
  routeId: string;
  routeName: string;
  vehicleType: Database["public"]["Enums"]["vehicle_type"];
};

type DriverRow = {
  vehicles: {
    id: string;
    route_id: string;
    label: string | null;
    plate: string | null;
    capacity: number;
    routes: { name: string; vehicle_type: DriverVehicle["vehicleType"] | null } | null;
  } | null;
};

/** The signed-in driver's vehicle and route, or null when they haven't verified a vehicle. */
export const fetchDriverVehicle = async (client: Client, userId: string): Promise<DriverVehicle | null> => {
  const res = await client
    .from("drivers")
    .select("vehicles(id, route_id, label, plate, capacity, routes(name, vehicle_type))")
    .eq("user_id", userId)
    .maybeSingle();
  // The embedded select is typed loosely by supabase-js, so pin the shape here.
  const row = must(res as { data: DriverRow | null; error: { message: string } | null });
  const v = row?.vehicles;
  if (!v) return null;
  const r = v.routes;
  return {
    id: v.id,
    label: v.label,
    plate: v.plate,
    capacity: v.capacity,
    routeId: v.route_id,
    routeName: r?.name ?? "",
    vehicleType: r?.vehicle_type ?? "ejeep",
  };
};

export const fetchVehicleLive = async (client: Client, vehicleId: string): Promise<VehicleLive | null> =>
  must(await client.from("vehicle_live").select("*").eq("vehicle_id", vehicleId).maybeSingle());

/** Clients may call start_shift directly. It resets seats to 0. */
export const startShift = async (client: Client): Promise<VehicleLive> =>
  must(await client.rpc("start_shift")) as unknown as VehicleLive;

export const trackingCount = async (client: Client, vehicleId: string): Promise<number> =>
  must(await client.rpc("tracking_count", { p_vehicle_id: vehicleId }));
