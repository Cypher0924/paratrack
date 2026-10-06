import { pingSchema } from "@repo/core";
import { driverRpc, ok } from "../../../../lib/driver-api";
import { afterPing } from "../../../../lib/dispatch";

export async function POST(req: Request) {
  const r = await driverRpc(req, "driver_ping", {
    schema: pingSchema,
    args: (b) => ({ p_lat: b.lat, p_lng: b.lng, p_speed: b.speed, p_heading: b.heading, p_accuracy: b.accuracy }),
  });
  if ("response" in r) return r.response;
  await afterPing((r.result as { vehicle_id: string }).vehicle_id);
  return ok(r.result);
}
