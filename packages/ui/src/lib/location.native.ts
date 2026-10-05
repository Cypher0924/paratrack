import * as Location from "expo-location";
import { useEffect, useState } from "react";

export type Position = { lat: number; lng: number; accuracy: number | null };

const toPosition = (p: Location.LocationObject): Position => ({
  lat: p.coords.latitude,
  lng: p.coords.longitude,
  accuracy: p.coords.accuracy ?? null,
});

/** Asks for foreground permission and returns one fix, or null if denied or unavailable. */
export async function requestLocation(): Promise<Position | null> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return null;
  try {
    return toPosition(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  } catch {
    return null;
  }
}

/** Watches the device position once permission is granted. The position never leaves the device. */
export function useLocation(enabled = true): { position: Position | null; denied: boolean } {
  const [position, setPosition] = useState<Position | null>(null);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | undefined;
    let live = true;
    Location.getForegroundPermissionsAsync().then(async ({ granted }) => {
      if (!live) return;
      setDenied(!granted);
      if (!granted) return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (p) => setPosition(toPosition(p)),
      );
      if (!live) sub.remove();
    });
    return () => {
      live = false;
      sub?.remove();
    };
  }, [enabled]);
  return { position, denied };
}
