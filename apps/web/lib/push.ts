import type { SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";

export type PushTarget = { id: string; kind: string; token: string; keys: { p256dh: string; auth: string } | null };
export type PushMessage = { title: string; body: string; data?: Record<string, unknown>; badge?: number };

const EXPO_URL = "https://exp.host/--/api/v2/push/send";
let vapidReady = false;

function initVapid() {
  if (vapidReady) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@paratrack.invalid",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
    process.env.VAPID_PRIVATE_KEY ?? "",
  );
  vapidReady = true;
}

/** Sends to every target and returns the ids of dead ones (410/404, DeviceNotRegistered). */
export async function sendPush(targets: PushTarget[], msg: PushMessage): Promise<string[]> {
  const dead: string[] = [];
  const web = targets.filter((t) => t.kind === "web" && t.keys);
  const expo = targets.filter((t) => t.kind === "expo");

  if (web.length) initVapid();
  const payload = JSON.stringify({ title: msg.title, body: msg.body, data: msg.data ?? {}, badge: msg.badge });
  await Promise.all(
    web.map(async (t) => {
      try {
        await webpush.sendNotification({ endpoint: t.token, keys: t.keys! }, payload);
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(t.id);
      }
    }),
  );

  if (expo.length) {
    try {
      const res = await fetch(EXPO_URL, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(
          expo.map((t) => ({
            to: t.token,
            title: msg.title,
            body: msg.body,
            data: msg.data ?? {},
            badge: msg.badge,
            sound: "default",
            channelId: "default",
          })),
        ),
      });
      const json = (await res.json()) as { data?: { status: string; details?: { error?: string } }[] };
      json.data?.forEach((r, i) => {
        if (r.status === "error" && r.details?.error === "DeviceNotRegistered") dead.push(expo[i].id);
      });
    } catch {
      // Network failure: keep the targets, the inbox row already exists.
    }
  }
  return dead;
}

/** Pushes one message to all of a user's targets and deletes the dead ones. */
export async function pushToUser(admin: SupabaseClient, userId: string, msg: Omit<PushMessage, "badge">): Promise<void> {
  const [{ data: subs }, { count }] = await Promise.all([
    admin.from("push_subscriptions").select("id, kind, token, keys").eq("user_id", userId),
    admin.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
  ]);
  if (!subs?.length) return;
  const dead = await sendPush(subs as PushTarget[], { ...msg, badge: count ?? undefined });
  if (dead.length) await admin.from("push_subscriptions").delete().in("id", dead);
}
