import { createClient } from "@supabase/supabase-js";
import type { Database } from "@repo/core";
import type { ZodType } from "zod";

type Rpc = Parameters<ReturnType<typeof createClient<Database>>["rpc"]>[0];

// SQL raises plain codes. Anything else is a server error.
const STATUS: Record<string, number> = { not_online: 409, vehicle_in_use: 409, not_a_driver: 403 };

const json = (body: unknown, status: number) => Response.json(body, { status });

/**
 * Shared by the three driver routes: verify the bearer token, validate the body, then call the RPC with a client that
 * carries the caller's token so `auth.uid()` is the driver. Returns the RPC result as JSON.
 */
export async function driverRpc<T>(
  req: Request,
  rpc: Rpc,
  opts: { schema?: ZodType<T>; args?: (body: T) => Record<string, unknown> },
): Promise<{ response: Response } | { result: unknown; userId: string }> {
  const token = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1];
  if (!token) return { response: json({ error: "unauthorized" }, 401) };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { response: json({ error: "server_misconfigured" }, 500) };
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: claims, error: authError } = await client.auth.getClaims(token);
  if (authError || !claims?.claims.sub) return { response: json({ error: "unauthorized" }, 401) };

  let args: Record<string, unknown> = {};
  if (opts.schema) {
    const body = await req.json().catch(() => undefined);
    const parsed = opts.schema.safeParse(body);
    if (!parsed.success) return { response: json({ error: "invalid_body", issues: parsed.error.issues }, 400) };
    args = opts.args?.(parsed.data) ?? {};
  }

  const { data, error } = await client.rpc(rpc, args as never);
  if (error) return { response: json({ error: error.message }, STATUS[error.message] ?? 500) };
  return { result: data, userId: claims.claims.sub };
}

export const ok = (result: unknown) => json(result ?? { ok: true }, 200);
