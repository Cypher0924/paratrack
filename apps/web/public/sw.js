// ParaTrack service worker: web push, app badge, and a minimal app-shell cache for offline launch.
const CACHE = "paratrack-shell-v2";
const SHELL = ["/start", "/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Navigations go to the network and fall back to the cached shell. Static assets are network-first and cached as they load.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/start", copy));
          return res;
        })
        .catch(() => caches.match("/start").then((r) => r || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|ico|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || Response.error())),
    );
  }
});

self.addEventListener("push", (event) => {
  const p = event.data ? event.data.json() : {};
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(p.title || "ParaTrack", {
        body: p.body,
        icon: "/icon-192.png",
        badge: "/badge-96.png",
        data: p.data || {},
      }),
      self.navigator.setAppBadge && p.badge ? self.navigator.setAppBadge(p.badge) : Promise.resolve(),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/alerts";
  event.waitUntil(
    (async () => {
      if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge();
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (all.length) {
        const w = all[0];
        if ("navigate" in w) await w.navigate(url).catch(() => {});
        return w.focus();
      }
      return self.clients.openWindow(url);
    })(),
  );
});
