import { describe, expect, it } from "vitest";
import { becameFull, shouldSendArrival, shouldSendPara } from "./alerts";

const arr = { status: "tracking" as const, arrivalAlert: true, arrivalSentAt: null, alertMinutes: 2 };
describe("shouldSendArrival", () => {
  it("true at 120s", () => expect(shouldSendArrival(arr, 120)).toBe(true));
  it("false at 121s", () => expect(shouldSendArrival(arr, 121)).toBe(false));
  it("false when already sent", () => expect(shouldSendArrival({ ...arr, arrivalSentAt: "2026-10-04T00:00:00Z" }, 60)).toBe(false));
  it("false when onboard", () => expect(shouldSendArrival({ ...arr, status: "onboard" }, 60)).toBe(false));
  it("false when alerts off", () => expect(shouldSendArrival({ ...arr, arrivalAlert: false }, 60)).toBe(false));
});

const para = { status: "onboard" as const, paraAlert: true, paraSentAt: null };
describe("shouldSendPara", () => {
  it("true between previous stop and alight stop", () => expect(shouldSendPara(para, 450, 400, 600, 1000)).toBe(true));
  it("false before previous stop", () => expect(shouldSendPara(para, 350, 400, 600, 1000)).toBe(false));
  it("wraps", () => expect(shouldSendPara(para, 980, 950, 50, 1000)).toBe(true));
  it("false when already sent", () => expect(shouldSendPara({ ...para, paraSentAt: "x" }, 450, 400, 600, 1000)).toBe(false));
  it("false when tracking", () => expect(shouldSendPara({ ...para, status: "tracking" }, 450, 400, 600, 1000)).toBe(false));
});

describe("becameFull", () => {
  it("available to full", () => expect(becameFull({ status: "available" }, { status: "full" })).toBe(true));
  it("filling to full", () => expect(becameFull({ status: "filling" }, { status: "full" })).toBe(true));
  it("full to full", () => expect(becameFull({ status: "full" }, { status: "full" })).toBe(false));
  it("full to available", () => expect(becameFull({ status: "full" }, { status: "available" })).toBe(false));
});
