import { seatsSchema } from "@repo/core";
import { driverRpc, ok } from "../../../../lib/driver-api";

export async function POST(req: Request) {
  const r = await driverRpc(req, "driver_set_seats", {
    schema: seatsSchema,
    args: (b) => ({ p_count: b.count ?? null, p_full: b.full ?? null }),
  });
  if ("response" in r) return r.response;
  // dispatch: when result.is_full and not result.was_full, alert trackers that the vehicle is full (notifications work)
  return ok(r.result);
}
