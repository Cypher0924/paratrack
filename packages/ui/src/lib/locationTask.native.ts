import { usableFix } from "@repo/core";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { postDriver } from "./driverApi";

export const LOCATION_TASK = "paratrack-driver-location";

// Must run at module scope, loaded from the app entry, so Android can start it headless with the app closed.
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  // One ping per batch: the newest fix that is accurate enough. Indoor fixes can jump hundreds of meters.
  const fix = [...locations].reverse().find((l) => usableFix(l.coords.accuracy));
  if (!fix) return;
  const { latitude, longitude, accuracy, speed, heading } = fix.coords;
  try {
    await postDriver("ping", {
      lat: latitude,
      lng: longitude,
      speed: speed == null || speed < 0 ? null : Math.min(speed, 60),
      heading: heading == null || heading < 0 ? null : heading % 360,
      accuracy,
    });
  } catch {
    // Offline or not online: the next fix tries again. The server ends stale shifts after 5 minutes.
  }
});
