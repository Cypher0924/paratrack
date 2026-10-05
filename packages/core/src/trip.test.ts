import { describe, expect, it } from "vitest";
import { etaLabel, stopsAway, tripTimeline } from "./trip";

const stops = [0, 300, 1000, 2500].map((offsetM, i) => ({ id: `s${i}`, offsetM }));

describe("trip", () => {
  it("labels ETAs in whole minutes, at least 1", () => {
    expect(etaLabel(5)).toBe("1 min");
    expect(etaLabel(420)).toBe("7 min");
  });
  it("counts stops between the vehicle and a stop", () => {
    expect(stopsAway(100, 2500, stops.map((s) => s.offsetM), 5000)).toBe(3);
    expect(stopsAway(100, 300, stops.map((s) => s.offsetM), 5000)).toBe(1);
  });
  it("places the vehicle in the leg", () => {
    const t = tripTimeline(stops, 0, 2500, 1200, 5, 5000);
    expect(t.map((e) => e.state)).toEqual(["passed", "passed", "vehicle", "destination"]);
  });
  it("keeps every stop upcoming when the vehicle is outside the leg", () => {
    const t = tripTimeline(stops, 300, 2500, 100, 5, 5000);
    expect(t.map((e) => e.state)).toEqual(["upcoming", "upcoming", "destination"]);
  });
});
