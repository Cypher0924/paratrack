import { describe, expect, it } from "vitest";
import { groupTrips, tripMinutes, tripRange } from "./history";

const now = new Date("2026-10-07T04:00:00Z"); // Wed 12:00 Manila
const at = (iso: string) => ({ boarded_at: iso, created_at: iso, ended_at: iso });

describe("tripMinutes", () => {
  it("measures boarding to end", () =>
    expect(tripMinutes({ boarded_at: "2026-10-07T01:48:00Z", created_at: "2026-10-07T01:40:00Z", ended_at: "2026-10-07T02:03:00Z" })).toBe(15));
  it("falls back to created_at", () =>
    expect(tripMinutes({ boarded_at: null, created_at: "2026-10-07T01:40:00Z", ended_at: "2026-10-07T01:50:00Z" })).toBe(10));
  it("is null while open", () => expect(tripMinutes({ boarded_at: null, created_at: "2026-10-07T01:40:00Z", ended_at: null })).toBeNull());
});

describe("groupTrips", () => {
  it("splits by Manila day", () => {
    const items = [
      { ended_at: "2026-10-07T02:00:00Z" },
      { ended_at: "2026-10-06T17:00:00Z" }, // 1:00 Manila today
      { ended_at: "2026-10-05T02:00:00Z" },
      { ended_at: "2026-09-20T02:00:00Z" },
    ];
    const g = groupTrips(items, now);
    expect(g.today).toHaveLength(2);
    expect(g.week).toHaveLength(1);
    expect(g.earlier).toHaveLength(1);
  });
});

describe("tripRange", () => {
  it("shares AM/PM", () =>
    expect(tripRange({ boarded_at: "2026-10-07T01:48:00Z", created_at: "", ended_at: "2026-10-07T02:03:00Z" }, now)).toBe("9:48 to 10:03 AM"));
  it("prefixes the weekday", () =>
    expect(tripRange({ ...at("2026-10-05T09:10:00Z"), ended_at: "2026-10-05T09:52:00Z" }, now)).toBe("Mon 5:10 to 5:52 PM"));
  it("keeps both when AM/PM differ", () =>
    expect(tripRange({ boarded_at: "2026-10-07T03:55:00Z", created_at: "", ended_at: "2026-10-07T04:10:00Z" }, now)).toBe("11:55 AM to 12:10 PM"));
});
