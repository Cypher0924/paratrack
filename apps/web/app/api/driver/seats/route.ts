import { seatsSchema } from "@repo/core";
import { driverRpc, ok } from "../../../../lib/driver-api";
import { adminClient, afterSeats } from "../../../../lib/dispatch";

export async function POST(req: Request) {
  const r = await driverRpc(req, "driver_set_seats", {
    schema: seatsSchema,
    args: (b) => ({ p_count: b.count ?? null, p_full: b.full ?? null }),
  });
  if ("response" in r) return r.response;
  const { was_full, is_full } = r.result as { was_full: boolean; is_full: boolean };
  if (is_full && !was_full) {
    // driver_set_seats doesn't return the vehicle, so read it from the caller's driver row.
    const { data } = await adminClient().from("drivers").select("vehicle_id").eq("user_id", r.userId).single();
    if (data?.vehicle_id) await afterSeats(data.vehicle_id, true);
  }
  return ok(r.result);
}
