import webpush from "web-push";

export const runtime = "nodejs";
export const maxDuration = 30;

function valid(b: unknown): b is webpush.PushSubscription {
  const o = b as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  return (
    !!o &&
    typeof o.endpoint === "string" &&
    o.endpoint.startsWith("https://") &&
    typeof o.keys?.p256dh === "string" &&
    typeof o.keys?.auth === "string"
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!valid(body)) return new Response("bad subscription", { status: 400 });

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  await new Promise((r) => setTimeout(r, 15000));
  try {
    await webpush.sendNotification(
      body,
      JSON.stringify({
        title: "E-jeep 18 is 2 min away",
        body: "Head to Rizal Ave. It arrives at 9:48 AM with 3 seats left.",
        badge: 3,
      }),
    );
    return new Response("sent");
  } catch (e) {
    return new Response("push failed: " + (e as Error).message, { status: 502 });
  }
}
