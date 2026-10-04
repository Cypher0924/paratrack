import { describe, expect, it } from "vitest";
import { pingSchema, pushSubscriptionSchema, seatsSchema } from "./schemas";

const ping = { lat: 15.47, lng: 120.59, speed: null, heading: null, accuracy: 12 };
describe("pingSchema", () => {
  it("accepts valid", () => expect(pingSchema.safeParse(ping).success).toBe(true));
  it.each([{ lat: 91 }, { lng: -181 }, { accuracy: -1 }, { speed: 70 }, { extra: 1 }])("rejects %j", (o) =>
    expect(pingSchema.safeParse({ ...ping, ...o }).success).toBe(false),
  );
});

describe("seatsSchema", () => {
  it.each([{ count: 3 }, { full: true }, { count: 3, full: false }])("accepts %j", (o) => expect(seatsSchema.safeParse(o).success).toBe(true));
  it.each([{}, { count: -1 }, { count: 2.5 }])("rejects %j", (o) => expect(seatsSchema.safeParse(o).success).toBe(false));
});

describe("pushSubscriptionSchema", () => {
  const web = { kind: "web", endpoint: "https://push.example/abc", keys: { p256dh: "k", auth: "a" } };
  it("accepts web", () => expect(pushSubscriptionSchema.safeParse(web).success).toBe(true));
  it("rejects http endpoint", () => expect(pushSubscriptionSchema.safeParse({ ...web, endpoint: "http://push.example/abc" }).success).toBe(false));
  it("accepts expo", () => expect(pushSubscriptionSchema.safeParse({ kind: "expo", token: "ExponentPushToken[abc]" }).success).toBe(true));
  it.each(["abc", "ExpoPushToken[abc]", "ExponentPushToken[]"])("rejects expo token %s", (token) =>
    expect(pushSubscriptionSchema.safeParse({ kind: "expo", token }).success).toBe(false),
  );
});
