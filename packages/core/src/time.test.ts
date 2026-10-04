import { describe, expect, it } from "vitest";
import { clockTime, updatedAgo } from "./time";

describe("clockTime", () => {
  it("formats in Manila", () => expect(clockTime(new Date("2026-10-04T01:48:00Z"))).toBe("9:48 AM"));
});

describe("updatedAgo", () => {
  const now = new Date("2026-10-04T00:00:00Z");
  const ago = (s: number) => updatedAgo(new Date(now.getTime() - s * 1000), now);
  it("just now", () => expect(ago(2)).toBe("updated just now"));
  it("seconds", () => expect(ago(10)).toBe("updated 10 sec ago"));
  it("minutes", () => expect(ago(125)).toBe("updated 2 min ago"));
  it("hours", () => expect(ago(7200)).toBe("updated 2 hr ago"));
});
