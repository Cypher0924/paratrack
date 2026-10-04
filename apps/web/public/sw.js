self.addEventListener("push", (event) => {
  const p = event.data ? event.data.json() : {};
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(p.title || "ParaTrack", {
        body: p.body,
        icon: "/icon-192.png",
      }),
      self.navigator.setAppBadge && p.badge
        ? self.navigator.setAppBadge(p.badge)
        : Promise.resolve(),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      if (self.navigator.clearAppBadge) await self.navigator.clearAppBadge();
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (all.length) return all[0].focus();
      return self.clients.openWindow("/spike/push");
    })(),
  );
});
