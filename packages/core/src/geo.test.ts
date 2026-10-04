import { describe, expect, it } from "vitest";
import { ahead, haversineM } from "./geo";

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
