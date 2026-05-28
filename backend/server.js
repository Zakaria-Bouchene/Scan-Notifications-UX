import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();

app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://YOUR-NETLIFY-NAME.netlify.app"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

/**
 * In-memory state
 * users: { [username]: Set<socketId> }
 * notifications: { [id]: notificationObject }
 */

const users = new Map();
const notifications = new Map();

function onlineUsers() {
  return [...users.entries()].map(([username, sockets]) => ({
    username,
    online: sockets.size > 0,
    sessions: sockets.size,
  }));
}

function broadcastPresence() {
  io.emit("presence:update", onlineUsers());
}

io.on("connection", (socket) => {
  let currentUser = null;

  console.log(`[+] socket connected ${socket.id}`);

  // LOGIN
  socket.on("auth:login", ({ username }, ack) => {
    if (!username || typeof username !== "string") {
      ack?.({ ok: false, error: "invalid username" });
      return;
    }

    currentUser = username;

    if (!users.has(username)) {
      users.set(username, new Set());
    }

    users.get(username).add(socket.id);

    socket.join(`user:${username}`);

    ack?.({
      ok: true,
      username,
    });

    broadcastPresence();

    console.log(`[auth] ${username} logged in (${socket.id})`);
  });

  // GET USERS
  socket.on("presence:list", (_, ack) => {
    ack?.(onlineUsers());
  });

  // SEND NOTIFICATION
  socket.on("notify:send", ({ to, message }, ack) => {
    if (!currentUser) {
      ack?.({
        ok: false,
        error: "not logged in",
      });

      return;
    }

    const id = `n_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const note = {
      id,
      from: currentUser,
      to,
      message: message || `Ping from ${currentUser}`,
      status: "SENT",
      sentAt: Date.now(),
      deliveredAt: null,
      seenAt: null,
    };

    notifications.set(id, note);

    // ACK sender
    ack?.({
      ok: true,
      notification: note,
    });

    // DELIVER
    io.to(`user:${to}`).emit("notify:incoming", note);

    // UPDATE SENDER
    io.to(`user:${currentUser}`).emit("notify:status", note);
  });

  // DELIVERED
  socket.on("notify:delivered", ({ id }) => {
    const note = notifications.get(id);

    if (!note || note.status === "SEEN") return;

    note.status = "DELIVERED";
    note.deliveredAt = Date.now();

    io.to(`user:${note.from}`).emit("notify:status", note);
  });

  // SEEN
  socket.on("notify:seen", ({ id }) => {
    const note = notifications.get(id);

    if (!note) return;

    note.status = "SEEN";
    note.seenAt = Date.now();

    io.to(`user:${note.from}`).emit("notify:status", note);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    if (currentUser && users.has(currentUser)) {
      users.get(currentUser).delete(socket.id);

      if (users.get(currentUser).size === 0) {
        users.delete(currentUser);
      }

      broadcastPresence();
    }

    console.log(`[-] socket disconnected ${socket.id}`);
  });
});

// ROOT
app.get("/", (_req, res) => {
  res.send("Backend running successfully");
});

// HEALTH CHECK
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    users: onlineUsers(),
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});