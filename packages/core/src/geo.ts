export const ahead = (from: number, to: number, length: number): number => (((to - from) % length) + length) % length;

export const haversineM = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.sqrt(h));
};

export const WALK_M_PER_MIN = 80;

export const walkMinutes = (distanceM: number): number => Math.ceil(distanceM / WALK_M_PER_MIN);

export const nearestStop = <S extends { lat: number; lng: number }>(
  position: { lat: number; lng: number },
  stops: readonly S[],
): { stop: S; distanceM: number } | null => {
  let best: { stop: S; distanceM: number } | null = null;
  for (const stop of stops) {
    const distanceM = haversineM(position, stop);
    if (!best || distanceM < best.distanceM) best = { stop, distanceM };
  }
  return best;
};

/** Distance along a looping route from one stop offset to another, in km. */
export const legDistanceKm = (fromOffsetM: number, toOffsetM: number, routeLengthM: number): number =>
  ahead(fromOffsetM, toOffsetM, routeLengthM) / 1000;
