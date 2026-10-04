import { describe, expect, it } from "vitest";
import { etaSeconds } from "./eta";

describe("etaSeconds", () => {
  it("distance over speed", () => expect(etaSeconds({ progressM: 100, speedMps: 6 }, 700, 1000)).toBe(100));
  it("stopped vehicle uses 3 m/s", () => expect(etaSeconds({ progressM: 0, speedMps: 0 }, 300, 1000)).toBe(100));
  it("wraps", () => expect(etaSeconds({ progressM: 900, speedMps: 10 }, 100, 1000)).toBe(20));
});
