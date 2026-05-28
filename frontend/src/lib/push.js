// Web Notifications helper.
// Background-push (browser closed) requires Web Push + VAPID or FCM — see README.

export async function ensureNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
}

export function showBrowserNotification({ title, body, onClick, tag }) {
  if (!("Notification" in window) || Notification.permission !== "granted") return null;
  try {
    const n = new Notification(title, {
      body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: tag || undefined,
    });
    if (onClick) n.onclick = () => { window.focus(); onClick(); n.close(); };
    return n;
  } catch (e) {
    console.warn("Notification failed:", e);
    return null;
  }
}

export function playSound() {
  try {
    const a = new Audio("/notification.mp3");
    a.volume = 0.5;
    a.play().catch(() => {});
  } catch (_) {}
}

export function browserSupport() {
  return {
    notifications: "Notification" in window,
    serviceWorker: "serviceWorker" in navigator,
    pushManager: "PushManager" in window,
    permission: "Notification" in window ? Notification.permission : "unsupported",
    online: navigator.onLine,
    userAgent: navigator.userAgent,
  };
}
