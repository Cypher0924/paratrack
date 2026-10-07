export type PushResult = "on" | "denied" | "unsupported" | "needs-install";

const b64ToBytes = (s: string) => {
  const raw = atob((s + "=".repeat((4 - (s.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

/** iPhone or iPad Safari that has not been added to the Home Screen. Web Push only works once installed. */
export function needsInstall(): boolean {
  if (typeof navigator === "undefined") return false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

/** Call from a tap. Registers the service worker, asks permission, subscribes and saves the target. */
export async function enablePush(accessToken: string): Promise<PushResult> {
  if (needsInstall()) return "needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  await navigator.serviceWorker.register("/sw.js");
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) }));
  const json = sub.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ kind: "web", endpoint: json.endpoint, keys: json.keys }),
  });
  return res.ok ? "on" : "unsupported";
}

/** True while the browser has not been asked yet. Denied, granted and unsupported all skip the primer. */
export async function pushUndecided(): Promise<boolean> {
  return typeof window !== "undefined" && "Notification" in window && Notification.permission === "default";
}
