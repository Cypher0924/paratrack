import { z } from "zod";

export const pingSchema = z.strictObject({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0).max(60).nullable(),
  heading: z.number().min(0).max(360).nullable(),
  accuracy: z.number().min(0).nullable(),
});

export const seatsSchema = z
  .strictObject({ count: z.number().int().min(0).optional(), full: z.boolean().optional() })
  .refine((v) => v.count !== undefined || v.full !== undefined, "count or full required");

// The server posts to the stored endpoint when alerts fire, so only the browsers' push services are allowed.
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /\.notify\.windows\.com$/];
const isPushService = (url: string) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && PUSH_HOSTS.some((h) => h.test(u.hostname));
  } catch {
    return false;
  }
};

export const pushSubscriptionSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("web"),
    endpoint: z.string().url().refine(isPushService, "not a push service endpoint"),
    keys: z.strictObject({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  }),
  z.strictObject({ kind: z.literal("expo"), token: z.string().regex(/^ExponentPushToken\[[^\]]+\]$/) }),
]);
