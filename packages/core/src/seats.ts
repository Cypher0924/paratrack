export type SeatStatus = "available" | "filling" | "full";

export const seatStatus = (v: { capacity: number; seatsTaken: number; markedFull: boolean }): { status: SeatStatus; seatsLeft: number } => {
  const left = v.capacity - v.seatsTaken;
  if (v.markedFull || left <= 0) return { status: "full", seatsLeft: 0 };
  return { status: left <= 5 ? "filling" : "available", seatsLeft: left };
};
