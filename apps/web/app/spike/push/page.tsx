"use client";

import { useEffect, useState } from "react";

function b64ToBytes(s: string) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export default function PushSpike() {
  const [log, setLog] = useState<string[]>([]);
  const [standalone, setStandalone] = useState(false);
  const [sub, setSub] = useState<PushSubscription | null>(null);
  const add = (m: string) => setLog((l) => [...l, m]);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const sync = () => setStandalone(mq.matches);
    mq.addEventListener("change", sync);
    queueMicrotask(sync);
    navigator.clearAppBadge?.().catch(() => {});
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => add("SW registered"))
        .catch((e) => add("SW failed: " + e));
    } else queueMicrotask(() => add("No service worker support"));
  }, []);

  async function enable() {
    try {
      const perm = await Notification.requestPermission();
      add("Permission: " + perm);
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const s =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64ToBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        }));
      setSub(s);
      add("Subscribed");
    } catch (e) {
      add("Enable failed: " + e);
    }
  }

  async function send() {
    if (!sub) return add("Turn on alerts first");
    add("Sending in 15 s. Close the app or lock the phone now.");
    const r = await fetch("/api/spike/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
    add("Server: " + r.status + " " + (await r.text()));
  }

  return (
    <main style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h1>Push spike</h1>
      <p>Installed (standalone): {String(standalone)}</p>
      <button onClick={enable} style={{ padding: 12, marginRight: 8 }}>Turn on alerts</button>
      <button onClick={send} style={{ padding: 12 }}>Send test in 15 s</button>
      <pre>{log.join("\n")}</pre>
    </main>
  );
}
