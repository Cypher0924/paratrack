import { describe, expect, it } from "vitest";
import { seatStatus } from "./seats";

describe("seatStatus", () => {
  it("available", () => expect(seatStatus({ capacity: 20, seatsTaken: 3, markedFull: false })).toEqual({ status: "available", seatsLeft: 17 }));
  it("filling", () => expect(seatStatus({ capacity: 20, seatsTaken: 15, markedFull: false })).toEqual({ status: "filling", seatsLeft: 5 }));
  it("full", () => expect(seatStatus({ capacity: 20, seatsTaken: 20, markedFull: false })).toEqual({ status: "full", seatsLeft: 0 }));
  it("marked full forces zero", () => expect(seatStatus({ capacity: 20, seatsTaken: 5, markedFull: true })).toEqual({ status: "full", seatsLeft: 0 }));
  it("over capacity is full", () => expect(seatStatus({ capacity: 20, seatsTaken: 25, markedFull: false })).toEqual({ status: "full", seatsLeft: 0 }));
});
