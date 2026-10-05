import type { Client, DriverVerification } from "./types";

/**
 * Figma 05: operator code plus plate, answered by the `verify_driver` RPC.
 *
 * The RPC returns its vehicle as a jsonb object on success. On a wrong code or plate it answers with
 * PostgREST's 400 status and a body, so supabase-js surfaces it as a normal error whose message is
 * the reason code.
 */
export const errorCodes = [
  "invalid_code_or_plate",
  "too_many_attempts",
  "vehicle_in_use",
  "phone_required",
] as const;

export type DriverErrorCode = (typeof errorCodes)[number] | "unknown";

export const driverErrorCode = (message: string | undefined): DriverErrorCode =>
  errorCodes.find((code) => message?.includes(code)) ?? "unknown";

export const verifyDriver = async (
  client: Client,
  operatorCode: string,
  plate: string,
): Promise<{ vehicle: DriverVerification | null; code: DriverErrorCode | null }> => {
  const { data, error } = await client.rpc("verify_driver", {
    p_operator_code: operatorCode.trim(),
    p_plate: plate.trim(),
  });
  if (error) return { vehicle: null, code: driverErrorCode(error.message) };
  return { vehicle: data as DriverVerification, code: null };
};