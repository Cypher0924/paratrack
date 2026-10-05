import { pingSchema } from "@repo/core";
import { driverRpc, ok } from "../../../../lib/driver-api";

export async function POST(req: Request) {
  const r = await driverRpc(req, "driver_ping", {
    schema: pingSchema,
    args: (b) => ({ p_lat: b.lat, p_lng: b.lng, p_speed: b.speed, p_heading: b.heading, p_accuracy: b.accuracy }),
  });
  if ("response" in r) return r.response;
  // dispatch: check this vehicle's trips for arrival and Para alerts, send push (notifications work)
  return ok(r.result);
}
