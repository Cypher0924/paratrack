import type { Database } from "@repo/core";
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

export const fetchTrip = async (client: Client, id: string): Promise<Trip | null> =>
  must(await client.from("trips").select("*").eq("id", id).maybeSingle());

/** Ended trips the commuter actually rode, newest first. Never-boarded trips are left out. */
export const fetchTripHistory = async (client: Client): Promise<Trip[]> =>
  must(
    await client
      .from("trips")
      .select("*")
      .eq("status", "ended")
      .not("boarded_at", "is", null)
      .order("ended_at", { ascending: false })
      .limit(100),
  );

export const saveFeedback = async (client: Client, tripId: string, feedback: string[]): Promise<Trip> =>
  must(await client.from("trips").update({ feedback }).eq("id", tripId).select("*").single());

export type ReportKind = Database["public"]["Tables"]["reports"]["Insert"]["kind"];

export const sendReport = async (client: Client, a: { tripId: string; kind: ReportKind; note: string }) => {
  const { error } = await client.from("reports").insert({ trip_id: a.tripId, kind: a.kind, note: a.note.trim() || null });
  if (error) throw new Error(error.message);
};
