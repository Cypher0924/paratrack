import { driverRpc, ok } from "../../../../lib/driver-api";
import { afterOffline } from "../../../../lib/dispatch";

export async function POST(req: Request) {
  const r = await driverRpc(req, "end_shift", {});
  if ("response" in r) return r.response;
  await afterOffline((r.result as { vehicle_id: string }).vehicle_id);
  return ok(r.result);
}
