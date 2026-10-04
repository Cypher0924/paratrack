import type { Client, Trip } from "./types";
import { must } from "./types";

export const fetchActiveTrips = async (client: Client): Promise<Trip[]> =>
  must(await client.from("trips").select("*").in("status", ["tracking", "onboard"]).order("created_at", { ascending: false }));

export const startTrip = async (
  client: Client,
  a: { vehicleId: string; boardStopId: string; alightStopId: string },
): Promise<Trip> =>
  must(
    await client
      .from("trips")
      .insert({ vehicle_id: a.vehicleId, board_stop_id: a.boardStopId, alight_stop_id: a.alightStopId })
      .select("*")
      .single(),
  );

const setStatus = async (client: Client, id: string, status: Trip["status"]): Promise<Trip> =>
  must(await client.from("trips").update({ status }).eq("id", id).select("*").single());

export const setOnboard = (client: Client, tripId: string) => setStatus(client, tripId, "onboard");
export const endTrip = (client: Client, tripId: string) => setStatus(client, tripId, "ended");

export const setTripAlerts = async (
  client: Client,
  tripId: string,
  alerts: { arrivalAlert?: boolean; paraAlert?: boolean },
): Promise<Trip> =>
  must(
    await client
      .from("trips")
      .update({ arrival_alert: alerts.arrivalAlert, para_alert: alerts.paraAlert })
      .eq("id", tripId)
      .select("*")
      .single(),
  );
