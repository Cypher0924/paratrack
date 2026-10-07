import { clockTime } from "./time";

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" });
const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Asia/Manila" });

const daysBetween = (at: Date, now: Date) =>
  Math.round((Date.parse(dayFmt.format(now)) - Date.parse(dayFmt.format(at))) / 86_400_000);

/** Whole minutes of a ride, at least 1. Starts at boarding, or creation when boarding was not stamped. */
export const tripMinutes = (t: { boarded_at: string | null; created_at: string; ended_at: string | null }): number | null =>
  t.ended_at ? Math.max(1, Math.round((Date.parse(t.ended_at) - Date.parse(t.boarded_at ?? t.created_at)) / 60_000)) : null;

/** Newest-first trips split into Today, the last 6 days before it, and older, by Manila calendar day of `ended_at`. */
export const groupTrips = <T extends { ended_at: string | null }>(
  items: readonly T[],
  now: Date,
): { today: T[]; week: T[]; earlier: T[] } => {
  const out = { today: [] as T[], week: [] as T[], earlier: [] as T[] };
  for (const i of items) {
    const d = i.ended_at ? daysBetween(new Date(i.ended_at), now) : 0;
    (d <= 0 ? out.today : d < 7 ? out.week : out.earlier).push(i);
  }
  return out;
};

/** "9:48 to 10:03 AM" style range, with "Mon " before it when the start was not today. */
export const tripRange = (t: { boarded_at: string | null; created_at: string; ended_at: string | null }, now: Date): string => {
  const start = new Date(t.boarded_at ?? t.created_at);
  const end = t.ended_at ? new Date(t.ended_at) : start;
  const a = clockTime(start);
  const b = clockTime(end);
  // Drop the AM/PM from the start when both share it.
  const from = a.slice(-2) === b.slice(-2) ? a.slice(0, -3) : a;
  return `${daysBetween(start, now) === 0 ? "" : `${weekdayFmt.format(start)} `}${from} to ${b}`;
};
