import { PING_INTERVAL_S, usableFix } from "@repo/core";
import { postDriver } from "./driverApi";

export type ShareError = "denied" | "unsupported" | "not_online";
export type ShareResult = { ok: true } | { ok: false; error: "denied" | "unsupported" };
export type ShareOptions = { onError?: (e: ShareError) => void };

let watchId: number | null = null;
let lock: WakeLockSentinel | null = null;
let lastSent = 0;
let onVisible: (() => void) | null = null;

const holdLock = async () => {
  try {
    lock = (await navigator.wakeLock?.request("screen")) ?? null;
  } catch {
    // Wake Lock can be refused (battery saver, unsupported). The shift still works while the page stays open.
  }
};

/**
 * Watches the position and posts it every ~5 s while the page is open. The Screen Wake Lock keeps the screen on,
 * since browsers stop location updates when the page is hidden. Resolves once the browser has permission.
 */
export function startSharing(opts: ShareOptions = {}): Promise<ShareResult> {
  stopSharing();
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve({ ok: false, error: "unsupported" });
  return new Promise((resolve) => {
    let settled = false;
    const settle = (r: ShareResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };
    watchId = navigator.geolocation.watchPosition(
      (p) => {
        settle({ ok: true });
        const { latitude, longitude, accuracy, speed, heading } = p.coords;
        const now = Date.now();
        if (!usableFix(accuracy) || now - lastSent < PING_INTERVAL_S * 1000 - 500) return;
        lastSent = now;
        postDriver("ping", {
          lat: latitude,
          lng: longitude,
          speed: speed == null ? null : Math.min(Math.max(speed, 0), 60),
          heading: heading == null || Number.isNaN(heading) ? null : ((heading % 360) + 360) % 360,
          accuracy,
        }).catch((e: Error) => e.message === "not_online" && opts.onError?.("not_online"));
      },
      (e) => {
        if (e.code === e.PERMISSION_DENIED) {
          settle({ ok: false, error: "denied" });
          opts.onError?.("denied");
        }
      },
      { enableHighAccuracy: true, maximumAge: 0 },
    );
    void holdLock();
    onVisible = () => document.visibilityState === "visible" && void holdLock();
    document.addEventListener("visibilitychange", onVisible);
  });
}

export function stopSharing() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  lastSent = 0;
  if (onVisible) document.removeEventListener("visibilitychange", onVisible);
  onVisible = null;
  void lock?.release().catch(() => {});
  lock = null;
}
