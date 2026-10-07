import { describe, expect, it } from "vitest";
import { alternativeRoutes, groupByDay, postedLabel, routesServing, timeAgo } from "./search";

const rs = [
  { routeId: "a", seq: 1, stopId: "x" },
  { routeId: "a", seq: 2, stopId: "y" },
  { routeId: "b", seq: 1, stopId: "y" },
  { routeId: "b", seq: 2, stopId: "x" },
  { routeId: "c", seq: 1, stopId: "x" },
];

describe("routesServing", () => {
  it("keeps every route serving both stops, since routes are loops", () => {
    expect(routesServing(rs, "x", "y")).toEqual(["a", "b"]);
    expect(routesServing(rs, "y", "x")).toEqual(["a", "b"]);
  });
  it("skips routes missing a stop and same-stop searches", () => {
    expect(routesServing(rs, "x", "z")).toEqual([]);
    expect(routesServing(rs, "x", "x")).toEqual([]);
  });
});

describe("groupByDay", () => {
  const now = new Date("2026-10-05T10:00:00+08:00");
  it("splits by Manila day", () => {
    const g = groupByDay(
      [{ created_at: "2026-10-05T00:30:00+08:00" }, { created_at: "2026-10-04T23:30:00+08:00" }],
      now,
    );
    expect(g.today).toHaveLength(1);
    expect(g.earlier).toHaveLength(1);
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-05T10:00:00+08:00");
  it("formats", () => {
    expect(timeAgo(new Date(now.getTime() - 20_000), now)).toBe("Just now");
    expect(timeAgo(new Date(now.getTime() - 8 * 60_000), now)).toBe("8 min ago");
    expect(timeAgo(new Date("2026-10-05T07:00:00+08:00"), now)).toBe("3 hr ago");
    expect(timeAgo(new Date("2026-10-04T20:00:00+08:00"), now)).toBe("Yesterday");
  });
});

describe("alternativeRoutes", () => {
  it("lists other routes sharing a stop", () => {
    expect(alternativeRoutes(rs, "a")).toEqual([
      { routeId: "b", sharedStopIds: ["y", "x"] },
      { routeId: "c", sharedStopIds: ["x"] },
    ]);
    expect(alternativeRoutes(rs, "zzz")).toEqual([]);
  });
});

describe("postedLabel", () => {
  const now = new Date("2026-10-05T10:00:00+08:00");
  it("names the day", () => {
    expect(postedLabel(new Date("2026-10-05T07:05:00+08:00"), now)).toBe("today at 7:05 AM");
    expect(postedLabel(new Date("2026-10-04T11:40:00+08:00"), now)).toBe("yesterday at 11:40 AM");
    expect(postedLabel(new Date("2026-10-01T11:40:00+08:00"), now)).toBe("Oct 1 at 11:40 AM");
  });
});
