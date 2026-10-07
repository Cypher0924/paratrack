import { clockTime } from "./time";
export type RouteStopRef = { routeId: string; seq: number; stopId: string };

/** Route ids serving both stops. Routes are loops, so either stop order is a valid ride. */
export const routesServing = (routeStops: readonly RouteStopRef[], fromStopId: string, toStopId: string): string[] => {
  if (fromStopId === toStopId) return [];
  const has = (routeId: string, stopId: string) => routeStops.some((r) => r.routeId === routeId && r.stopId === stopId);
  const ids = Array.from(new Set(routeStops.map((r) => r.routeId)));
  return ids.filter((id) => has(id, fromStopId) && has(id, toStopId));
};

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" });

/** Splits items (newest first) into today and earlier, by Manila calendar day. */
export const groupByDay = <T extends { created_at: string }>(items: readonly T[], now: Date): { today: T[]; earlier: T[] } => {
  const day = dayFmt.format(now);
  const today: T[] = [];
  const earlier: T[] = [];
  for (const i of items) (dayFmt.format(new Date(i.created_at)) === day ? today : earlier).push(i);
  return { today, earlier };
};

/** "Just now", "8 min ago", "3 hr ago", "Yesterday", or a short date. */
export const timeAgo = (at: Date, now: Date): string => {
  const min = Math.floor((now.getTime() - at.getTime()) / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  if (dayFmt.format(at) === dayFmt.format(now)) return `${Math.floor(min / 60)} hr ago`;
  const days = Math.round((Date.parse(dayFmt.format(now)) - Date.parse(dayFmt.format(at))) / 86_400_000);
  return days === 1 ? "Yesterday" : at.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
};

/** Other routes that share at least one stop with `routeId`, with the shared stop ids. Loops make any shared stop a valid transfer. */
export const alternativeRoutes = (
  routeStops: readonly RouteStopRef[],
  routeId: string,
): { routeId: string; sharedStopIds: string[] }[] => {
  const mine = new Set(routeStops.filter((r) => r.routeId === routeId).map((r) => r.stopId));
  const out = new Map<string, string[]>();
  for (const r of routeStops) if (r.routeId !== routeId && mine.has(r.stopId)) out.set(r.routeId, [...(out.get(r.routeId) ?? []), r.stopId]);
  return [...out].map(([id, sharedStopIds]) => ({ routeId: id, sharedStopIds }));
};

/** "today at 11:40 AM", "yesterday at 11:40 AM" or "Oct 3 at 11:40 AM". Manila time. */
export const postedLabel = (at: Date, now: Date): string => {
  const days = Math.round((Date.parse(dayFmt.format(now)) - Date.parse(dayFmt.format(at))) / 86_400_000);
  const day = days <= 0 ? "today" : days === 1 ? "yesterday" : at.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
  return `${day} at ${clockTime(at)}`;
};
