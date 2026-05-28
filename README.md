# Logistics Tracking — QR + Realtime Notifications Test App

A lightweight full-stack React + Node app to validate two features before integrating them into a larger logistics platform:

1. **QR Code Scanner** in the browser (desktop + mobile)
2. **Real-time push/browser notifications** between users with **SENT → DELIVERED → SEEN** tracking

## Stack

**Frontend**
- React 18 + Vite
- TailwindCSS
- React Router v6
- Socket.IO client
- `html5-qrcode` (camera scanning)
- `qrcode` (dynamic QR generation)
- Web Notifications API + Service Worker (PWA-ready)

**Backend**
- Node.js + Express
- Socket.IO server
- In-memory session store (no DB)

---

## Project structure

```
logistics-test/
├── backend/          # Node + Express + Socket.IO
│   ├── server.js
│   └── package.json
└── frontend/         # React + Vite
    ├── src/
    │   ├── pages/        # Login, Scanner, Notifications
    │   ├── components/   # Modal, Toast, Badge, etc.
    │   ├── hooks/        # useSocket, useNotifications
    │   └── lib/          # socket.js, push.js
    ├── public/
    │   ├── sw.js              # Service Worker
    │   └── notification.mp3   # (drop any short sound here, optional)
    └── package.json
```

---

## Setup

### 1. Backend

```bash
cd backend
npm install
npm start
```

Server runs on **http://localhost:4000**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on **http://localhost:5173**.

Vite is already configured to proxy `/socket.io` to the backend.

---

## How to test

### QR Scanner — `/scanner`
1. Open `http://localhost:5173/scanner` on desktop or mobile.
2. Grant camera permission.
3. Point at any QR code → modal pops with value + timestamp.
4. Use **Scan Again** to reset.
5. Use **Manual input** to simulate a scan without a camera.
6. Use the **QR Generator** card to create test QRs on the fly.

### Realtime Notifications — `/notifications`
1. Open the app in **two browser tabs** (or two devices on the same LAN — replace `localhost` with your machine IP).
2. Tab A → login as **user1**, Tab B → login as **user2**.
3. Both go to `/notifications`. You'll see the other user with an online dot.
4. Click **Send Notification to Other User**.
5. Recipient gets:
   - in-app toast
   - browser notification (even if tab is in background / minimized — as long as the tab is open)
   - sound (if `public/notification.mp3` exists)
6. Sender sees the status badge update live:
   - **SENT** → server received it
   - **DELIVERED** → recipient browser ACKed it
   - **SEEN** → recipient focused the tab or clicked the notification

### Testing on mobile
Run backend + frontend on your laptop, then from your phone open `http://<your-laptop-ip>:5173`. Camera works on `localhost` and on `https://` — for LAN testing on iOS Safari you may need to run Vite with HTTPS (see `vite.config.js` comment).

---

## Push when the browser is **closed**

Web Notifications shown from a regular page only work while the **tab is open** (it can be backgrounded or minimized — that's fine).

To get true background push (browser closed), you need the **Web Push protocol** with VAPID keys + a Service Worker `push` event handler, typically backed by **Firebase Cloud Messaging** or a self-hosted `web-push` setup.

This repo ships a **Service Worker stub** (`public/sw.js`) with a `push` event listener so you can plug in either path:

- **Self-hosted Web Push** — add `web-push` to backend, generate VAPID keys, store subscriptions, send via `webpush.sendNotification(...)`.
- **FCM** — initialize Firebase on the client, register `firebase-messaging-sw.js`, send from backend via FCM HTTP v1.

We left this as a documented extension point so the test app stays dependency-light. See `frontend/src/lib/push.js` for the subscription helper.

---

## What this app helps you evaluate

- Scan speed and camera compatibility across Chrome/Safari/Firefox, desktop + mobile.
- Real-time latency over Socket.IO (visible via `SENT → DELIVERED` timing).
- Whether `Notification` API fires reliably when the tab is hidden/minimized.
- Whether SEEN tracking via `visibilitychange` + notification `click` is reliable.
- Reconnect behavior (kill backend, watch the connection indicator).

---

## Deploy

- **Backend** → any Node host that supports websockets: Render, Railway, Fly.io, a VPS. Cloudflare Workers / Vercel serverless **won't** work for Socket.IO.
- **Frontend** → Vercel, Netlify, Cloudflare Pages. Set `VITE_SOCKET_URL` to your deployed backend URL.

```bash
cd frontend
VITE_SOCKET_URL=https://your-backend.example.com npm run build
```

---

## License

MIT — use freely in your logistics platform.
