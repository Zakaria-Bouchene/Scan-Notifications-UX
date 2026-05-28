// Minimal Service Worker.
// - Enables installable PWA.
// - Provides a `push` handler so you can plug in Web Push / FCM later.

const CACHE = "logitest-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Web Push entry point. Requires server-side VAPID + subscription storage to actually fire.
self.addEventListener("push", (event) => {
  let data = { title: "Notification", body: "You have a new message" };
  try {
    if (event.data) data = event.data.json();
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      data: data,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/notifications");
    })
  );
});
