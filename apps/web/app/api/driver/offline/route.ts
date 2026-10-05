import { driverRpc, ok } from "../../../../lib/driver-api";

export async function POST(req: Request) {
  const r = await driverRpc(req, "end_shift", {});
  if ("response" in r) return r.response;
  // dispatch: tell trackers the vehicle stopped sharing, result.trackers counts them (notifications work)
  return ok(r.result);
}
