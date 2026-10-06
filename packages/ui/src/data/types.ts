import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/core";

export type Client = SupabaseClient<Database>;
type Tables = Database["public"]["Tables"];

export type Profile = Tables["profiles"]["Row"];
export type ProfilePatch = Tables["profiles"]["Update"];
export type Trip = Tables["trips"]["Row"];
export type AppNotification = Tables["notifications"]["Row"];
export type VehicleLive = Tables["vehicle_live"]["Row"];
export type FareType = Database["public"]["Enums"]["fare_type"];

export type LngLat = [number, number];
export type Route = Omit<Tables["routes"]["Row"], "geom"> & { path: LngLat[] };
export type Stop = { id: string; name: string | null; lat: number; lng: number };
export type RouteStop = { routeId: string; seq: number; offsetM: number; stop: Stop };
export type Vehicle = Pick<Tables["vehicles"]["Row"], "id" | "route_id" | "label" | "plate" | "capacity">;
export type LiveVehicle = Vehicle & { live: VehicleLive | null };

/** What `verify_driver` returns for the driver's assigned vehicle (Figma 05). */
export type DriverVerification = {
  vehicle_id: string;
  label: string;
  plate: string;
  capacity: number;
  route_id: string;
  route_name: string;
};

export const must = <T>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
};
