import { describe, expect, it } from "vitest";
import { MAX_FIX_ACCURACY_M, usableFix } from "./driver";
import { pingSchema, seatsSchema } from "./schemas";

describe("usableFix", () => {
  it("keeps fixes within 50 m and fixes with no accuracy", () => {
    expect(usableFix(5)).toBe(true);
    expect(usableFix(MAX_FIX_ACCURACY_M)).toBe(true);
    expect(usableFix(null)).toBe(true);
  });
  it("drops fixes over 50 m", () => {
    expect(usableFix(50.1)).toBe(false);
    expect(usableFix(700)).toBe(false);
  });
});

describe("driver bodies", () => {
  it("accepts a ping and rejects extra or out of range fields", () => {
    const ok = { lat: 15.49, lng: 120.59, speed: 4, heading: 90, accuracy: 8 };
    expect(pingSchema.safeParse(ok).success).toBe(true);
    expect(pingSchema.safeParse({ ...ok, lat: 91 }).success).toBe(false);
    expect(pingSchema.safeParse({ ...ok, extra: 1 }).success).toBe(false);
  });
  it("needs count or full for seats", () => {
    expect(seatsSchema.safeParse({}).success).toBe(false);
    expect(seatsSchema.safeParse({ count: 3 }).success).toBe(true);
    expect(seatsSchema.safeParse({ full: false }).success).toBe(true);
  });
});
