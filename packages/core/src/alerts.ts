import { ahead } from "./geo";
import type { SeatStatus } from "./seats";

type TrackStatus = "tracking" | "onboard" | "ended";

export const shouldSendArrival = (
  t: { status: TrackStatus; arrivalAlert: boolean; arrivalSentAt: string | null; alertMinutes: number },
  etaSec: number,
): boolean => t.status === "tracking" && t.arrivalAlert && t.arrivalSentAt === null && etaSec <= t.alertMinutes * 60;

export const shouldSendPara = (
  t: { status: TrackStatus; paraAlert: boolean; paraSentAt: string | null },
  progressM: number,
  prevStopOffsetM: number,
  alightOffsetM: number,
  routeLengthM: number,
): boolean =>
  t.status === "onboard" &&
  t.paraAlert &&
  t.paraSentAt === null &&
  ahead(prevStopOffsetM, progressM, routeLengthM) < ahead(prevStopOffsetM, alightOffsetM, routeLengthM);

export const becameFull = (before: { status: SeatStatus }, after: { status: SeatStatus }): boolean =>
  before.status !== "full" && after.status === "full";
