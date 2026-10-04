import { ahead } from "./geo";

export const MIN_SPEED_MPS = 3;

export const etaSeconds = (v: { progressM: number; speedMps: number }, stopOffsetM: number, routeLengthM: number): number =>
  ahead(v.progressM, stopOffsetM, routeLengthM) / Math.max(v.speedMps, MIN_SPEED_MPS);
