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

export const pushSubscriptionSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("web"),
    endpoint: z.string().url().startsWith("https://"),
    keys: z.strictObject({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  }),
  z.strictObject({ kind: z.literal("expo"), token: z.string().regex(/^ExponentPushToken\[[^\]]+\]$/) }),
]);
