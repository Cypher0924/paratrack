import { describe, expect, it } from "vitest";
import { arrivalCopy, fullCopy, paraCopy, stoppedSharingCopy } from "./copy";

describe("arrivalCopy", () => {
  const a = { vehicleLabel: "E-jeep 18", minutes: 2, stopName: "Rizal Ave", arrivesAt: new Date("2026-10-04T01:48:00Z"), seatsLeft: 3 };
  it("plural seats", () =>
    expect(arrivalCopy(a)).toEqual({
      title: "E-jeep 18 is 2 min away",
      body: "Head to Rizal Ave. It arrives at 9:48 AM with 3 seats left.",
    }));
  it("one seat", () => expect(arrivalCopy({ ...a, seatsLeft: 1 }).body).toContain("with 1 seat left."));
});

describe("paraCopy", () => {
  it("matches Figma", () =>
    expect(paraCopy({ stopName: "SM City" })).toEqual({
      title: "Your stop is next",
      body: 'Get ready to say "Para po" at SM City.',
    }));
});

describe("fullCopy", () => {
  const a = { vehicleLabel: "E-jeep 18", routeName: "Downtown-SM", nextLabel: "E-jeep 7", stopName: "Rizal Ave", nextMinutes: 9 };
  it("with next vehicle", () =>
    expect(fullCopy(a)).toEqual({
      title: "E-jeep 18 is full",
      body: "Downtown-SM. The next E-jeep with seats reaches Rizal Ave in 9 min.",
    }));
  it("without next vehicle", () =>
    expect(fullCopy({ ...a, nextLabel: null, nextMinutes: null }).body).toBe("Downtown-SM. No other E-jeep with seats is on the way yet."));
});

describe("stoppedSharingCopy", () => {
  it("matches spec", () =>
    expect(stoppedSharingCopy({ vehicleLabel: "E-jeep 18", routeName: "Downtown-SM" })).toEqual({
      title: "E-jeep 18 stopped sharing",
      body: "The driver went offline. Check other vehicles on Downtown-SM.",
    }));
});
