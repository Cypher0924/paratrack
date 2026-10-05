import * as Location from "expo-location";
import { LOCATION_TASK } from "./locationTask.native";

export type ShareError = "denied" | "unsupported" | "not_online";
export type ShareResult = { ok: true } | { ok: false; error: "denied" | "unsupported" };
export type ShareOptions = { onError?: (e: ShareError) => void };

/** Starts the background task. Android keeps it alive with a foreground-service notification, screen off included. */
export async function startSharing(_opts: ShareOptions = {}): Promise<ShareResult> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return { ok: false, error: "denied" };
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== "granted") return { ok: false, error: "denied" };
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5000,
    foregroundService: {
      notificationTitle: "ParaTrack",
      notificationBody: "ParaTrack is sharing your location",
    },
  });
  return { ok: true };
}

export async function stopSharing() {
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}
