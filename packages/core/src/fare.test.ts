import { describe, expect, it } from "vitest";
import { fare, formatPeso } from "./fare";

const p = { baseFare: 15, baseKm: 4, perKm: 2.2 };

describe("fare", () => {
  it("matches the Figma student example", () => {
    const f = fare(p, 6.8, "student");
    expect(f.baseCentavos).toBe(1500);
    expect(f.extraKm).toBeCloseTo(2.8, 6);
    expect(f.extraCentavos).toBe(616);
    expect(f.discountCentavos).toBe(423);
    expect(f.roundingCentavos).toBe(7);
    expect(f.totalCentavos).toBe(1700);
  });
  it("regular 6.8 km rounds to 2125", () => expect(fare(p, 6.8, "regular").totalCentavos).toBe(2125));
  it("3 km student is base only with discount", () => {
    const f = fare(p, 3, "student");
    expect(f.extraCentavos).toBe(0);
    expect(f.discountCentavos).toBe(300);
    expect(f.totalCentavos).toBe(1200);
  });
  it("senior and pwd equal student", () => {
    expect(fare(p, 6.8, "senior")).toEqual(fare(p, 6.8, "student"));
    expect(fare(p, 6.8, "pwd")).toEqual(fare(p, 6.8, "student"));
  });
  it("zero or negative distance is base fare only", () => {
    for (const d of [0, -2]) {
      const f = fare(p, d, "regular");
      expect(f.extraKm).toBe(0);
      expect(f.extraCentavos).toBe(0);
      expect(f.totalCentavos).toBe(1500);
    }
  });
});

describe("formatPeso", () => {
  it("formats centavos", () => {
    expect(formatPeso(1700)).toBe("₱17.00");
    expect(formatPeso(616)).toBe("₱6.16");
    expect(formatPeso(-423)).toBe("-₱4.23");
  });
});
