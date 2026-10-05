import { createClient } from "@supabase/supabase-js";
import { pushSubscriptionSchema, type Database } from "@repo/core";
import { z } from "zod";

export const runtime = "nodejs";

const deleteSchema = z.strictObject({ kind: z.enum(["web", "expo"]), token: z.string().min(1) });

async function caller(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return null;
  const sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getClaims(token);
  const userId = data?.claims.sub;
  if (error || !userId) return null;
  return { sb, userId };
}

const bad = (message: string) => Response.json({ error: message }, { status: 400 });

export async function POST(req: Request) {
  const c = await caller(req);
  if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = pushSubscriptionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("invalid body");
  const b = parsed.data;
  const row =
    b.kind === "web"
      ? { user_id: c.userId, kind: "web", token: b.endpoint, keys: b.keys }
      : { user_id: c.userId, kind: "expo", token: b.token, keys: null };
  const { error } = await c.sb.from("push_subscriptions").upsert(row, { onConflict: "user_id,token" });
  if (error) return Response.json({ error: "save failed" }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const c = await caller(req);
  if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("invalid body");
  const { error } = await c.sb.from("push_subscriptions").delete().eq("user_id", c.userId).eq("token", parsed.data.token);
  if (error) return Response.json({ error: "delete failed" }, { status: 500 });
  return Response.json({ ok: true });
}
