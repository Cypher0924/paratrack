import { describe, expect, it } from "vitest";
import { ahead, haversineM, legDistanceKm, nearestStop, walkMinutes } from "./geo";

describe("ahead", () => {
  it("measures forward distance", () => expect(ahead(100, 300, 1000)).toBe(200));
  it("wraps around the loop", () => expect(ahead(900, 100, 1000)).toBe(200));
  it("is zero at the same point", () => expect(ahead(500, 500, 1000)).toBe(0));
});

describe("haversineM", () => {
  it("Capitol to SM City Tarlac", () => {
    const d = haversineM({ lat: 15.4869, lng: 120.5917 }, { lat: 15.4755, lng: 120.5963 });
    expect(d).toBeGreaterThan(1300);
    expect(d).toBeLessThan(1450);
  });
});

describe("walking and nearest stop", () => {
  const stops = [
    { id: "a", lat: 15.49, lng: 120.59 },
    { id: "b", lat: 15.5, lng: 120.6 },
  ];
  it("rounds walking time up at 80 m per minute", () => {
    expect(walkMinutes(0)).toBe(0);
    expect(walkMinutes(80)).toBe(1);
    expect(walkMinutes(81)).toBe(2);
  });
  it("picks the closest stop", () => {
    expect(nearestStop({ lat: 15.4999, lng: 120.5999 }, stops)?.stop.id).toBe("b");
    expect(nearestStop({ lat: 15.49, lng: 120.59 }, stops)?.distanceM).toBe(0);
  });
  it("returns null with no stops", () => {
    expect(nearestStop({ lat: 0, lng: 0 }, [])).toBeNull();
  });
  it("measures a leg across the loop seam", () => {
    expect(legDistanceKm(1000, 3500, 5000)).toBe(2.5);
    expect(legDistanceKm(4000, 500, 5000)).toBe(1.5);
  });
});
