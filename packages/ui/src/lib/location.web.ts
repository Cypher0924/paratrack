import { useEffect, useState } from "react";

export type Position = { lat: number; lng: number; accuracy: number | null };

const toPosition = (p: GeolocationPosition): Position => ({
  lat: p.coords.latitude,
  lng: p.coords.longitude,
  accuracy: p.coords.accuracy ?? null,
});

/** Asks for permission (the browser prompts on first use) and returns one fix, or null if denied or unavailable. */
export function requestLocation(): Promise<Position | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(toPosition(p)),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10_000 },
    ),
  );
}

/** Watches the device position. The position never leaves the device. */
export function useLocation(enabled = true): { position: Position | null; denied: boolean } {
  const [position, setPosition] = useState<Position | null>(null);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setDenied(false);
        setPosition(toPosition(p));
      },
      (e) => e.code === e.PERMISSION_DENIED && setDenied(true),
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);
  return { position, denied };
}
