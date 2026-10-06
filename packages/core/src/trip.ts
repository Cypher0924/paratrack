import { ahead } from "./geo";

/** "7 min". Never below 1 min, because "0 min" reads as already here. */
export const etaLabel = (etaSec: number): string => `${Math.max(1, Math.round(etaSec / 60))} min`;

/** Stops the vehicle still has to pass before the target stop, counting the target. */
export const stopsAway = (progressM: number, targetOffsetM: number, offsetsM: readonly number[], routeLengthM: number): number => {
  const gap = ahead(progressM, targetOffsetM, routeLengthM);
  return offsetsM.filter((o) => {
    const d = ahead(progressM, o, routeLengthM);
    return d > 0 && d <= gap;
  }).length;
};

export type TimelineStop = { id: string; offsetM: number };
export type TimelineEntry = { id: string; state: "passed" | "vehicle" | "upcoming" | "destination"; etaSec: number | null };

/** Stops from board to alight (inclusive) with the vehicle's place among them. A vehicle outside the leg leaves every stop upcoming. */
export const tripTimeline = (
  stops: readonly TimelineStop[],
  boardOffsetM: number,
  alightOffsetM: number,
  progressM: number,
  speedMps: number,
  routeLengthM: number,
): TimelineEntry[] => {
  const legLen = ahead(boardOffsetM, alightOffsetM, routeLengthM);
  const leg = stops
    .map((s) => ({ ...s, pos: ahead(boardOffsetM, s.offsetM, routeLengthM) }))
    .filter((s) => s.pos <= legLen)
    .sort((a, b) => a.pos - b.pos);
  const veh = ahead(boardOffsetM, progressM, routeLengthM);
  const inLeg = veh <= legLen;
  const lastPassed = inLeg ? leg.reduce((acc, s, i) => (s.pos <= veh ? i : acc), -1) : -1;
  return leg.map((s, i) => {
    if (i === leg.length - 1) return { id: s.id, state: "destination", etaSec: etaFrom(progressM, s.offsetM, speedMps, routeLengthM) };
    if (i < lastPassed) return { id: s.id, state: "passed", etaSec: null };
    if (i === lastPassed) return { id: s.id, state: "vehicle", etaSec: null };
    return { id: s.id, state: "upcoming", etaSec: etaFrom(progressM, s.offsetM, speedMps, routeLengthM) };
  });
};

const etaFrom = (progressM: number, offsetM: number, speedMps: number, routeLengthM: number) =>
  ahead(progressM, offsetM, routeLengthM) / Math.max(speedMps, 3);
