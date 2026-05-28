import { useEffect, useMemo, useRef, useState } from "react";
import { socket } from "../lib/socket.js";
import {
  ensureNotificationPermission,
  showBrowserNotification,
  playSound,
  browserSupport,
} from "../lib/push.js";

function StatusBadge({ status }) {
  const map = {
    SENT: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    DELIVERED: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    SEEN: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  };
  return (
    <span className={`text-[10px] tracking-wide font-semibold px-2 py-0.5 rounded-full ${map[status] || ""}`}>
      {status}
    </span>
  );
}

export default function Notifications({ user }) {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [presence, setPresence] = useState([]);
  const [sent, setSent] = useState([]); // notifications I sent
  const [inbox, setInbox] = useState([]); // notifications I received
  const [toasts, setToasts] = useState([]);
  const support = useMemo(browserSupport, []);
  const toastIdRef = useRef(0);

  const otherUser = user === "user1" ? "user2" : "user1";
  const otherOnline = presence.find((p) => p.username === otherUser)?.online;

  useEffect(() => {
    ensureNotificationPermission().then(setPermission);
    socket.emit("presence:list", null, (list) => setPresence(list || []));

    const onPresence = (list) => setPresence(list || []);
    const onIncoming = (note) => {
      setInbox((x) => [note, ...x].slice(0, 50));
      socket.emit("notify:delivered", { id: note.id });
      pushToast(`From ${note.from}: ${note.message}`);
      playSound();
      showBrowserNotification({
        title: `New ping from ${note.from}`,
        body: note.message,
        tag: note.id,
        onClick: () => socket.emit("notify:seen", { id: note.id }),
      });
      if (document.visibilityState === "visible") {
        socket.emit("notify:seen", { id: note.id });
      }
    };
    const onStatus = (note) => {
      // update either side
      setSent((list) => list.map((n) => (n.id === note.id ? { ...n, ...note } : n)));
    };
    socket.on("presence:update", onPresence);
    socket.on("notify:incoming", onIncoming);
    socket.on("notify:status", onStatus);

    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      // mark every undelivered/unread incoming as seen
      inboxRef.current.forEach((n) => {
        if (n.status !== "SEEN") socket.emit("notify:seen", { id: n.id });
      });
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      socket.off("presence:update", onPresence);
      socket.off("notify:incoming", onIncoming);
      socket.off("notify:status", onStatus);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep ref of latest inbox for the visibilitychange handler
  const inboxRef = useRef(inbox);
  useEffect(() => { inboxRef.current = inbox; }, [inbox]);

  function pushToast(text) {
    const id = ++toastIdRef.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }

  function sendPing() {
    socket.emit(
      "notify:send",
      { to: otherUser, message: `Hello from ${user} at ${new Date().toLocaleTimeString()}` },
      (resp) => {
        if (resp?.ok) setSent((x) => [resp.notification, ...x].slice(0, 50));
      }
    );
  }

  async function requestPerm() {
    const p = await ensureNotificationPermission();
    setPermission(p);
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <section className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Realtime ping</h2>
          <span className="text-xs text-slate-500">You are <b>{user}</b></span>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${otherOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            <div>
              <div className="font-medium">{otherUser}</div>
              <div className="text-xs text-slate-500">{otherOnline ? "online" : "offline"}</div>
            </div>
          </div>
          <button
            // disabled={!otherOnline}
            onClick={sendPing}
            className="rounded-lg bg-sky-600 text-white px-4 py-2 text-sm font-medium hover:bg-sky-700 disabled:opacity-40"
          >
            Send notification
          </button>
        </div>

        {permission !== "granted" && (
          <div className="mt-3 text-sm rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-3 py-2 flex items-center justify-between">
            <span>Browser notifications: <b>{permission}</b></span>
            <button onClick={requestPerm} className="underline">Enable</button>
          </div>
        )}

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Sent</h3>
            <div className="space-y-2 max-h-96 overflow-auto pr-1">
              {sent.length === 0 && <div className="text-xs text-slate-500">No outgoing notifications yet.</div>}
              {sent.map((n) => (
                <div key={n.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 animate-slide-in">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">→ {n.to}</div>
                    <StatusBadge status={n.status} />
                  </div>
                  <div className="text-sm mt-1">{n.message}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    {new Date(n.sentAt).toLocaleTimeString()}
                    {n.deliveredAt && ` · d+${n.deliveredAt - n.sentAt}ms`}
                    {n.seenAt && ` · s+${n.seenAt - n.sentAt}ms`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Received</h3>
            <div className="space-y-2 max-h-96 overflow-auto pr-1">
              {inbox.length === 0 && <div className="text-xs text-slate-500">Nothing received yet.</div>}
              {inbox.map((n) => (
                <div key={n.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 animate-slide-in">
                  <div className="text-xs text-slate-500">from {n.from}</div>
                  <div className="text-sm mt-1">{n.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Connected users</h3>
          <ul className="mt-3 space-y-2">
            {presence.map((p) => (
              <li key={p.username} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${p.online ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {p.username}
                </span>
                <span className="text-xs text-slate-500">{p.sessions} session{p.sessions !== 1 && "s"}</span>
              </li>
            ))}
            {presence.length === 0 && <li className="text-xs text-slate-500">No one online.</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm text-xs">
          <h3 className="text-sm font-semibold mb-2">Browser support</h3>
          <ul className="space-y-1 text-slate-600 dark:text-slate-300">
            <li>Notifications API: <b>{String(support.notifications)}</b></li>
            <li>Service Worker: <b>{String(support.serviceWorker)}</b></li>
            <li>Push Manager: <b>{String(support.pushManager)}</b></li>
            <li>Permission: <b>{support.permission}</b></li>
            <li>Online: <b>{String(support.online)}</b></li>
          </ul>
        </div>
      </aside>

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-slide-in max-w-xs">
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
