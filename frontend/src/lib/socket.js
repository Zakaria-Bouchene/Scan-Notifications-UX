import { io } from "socket.io-client";

const URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:4000";

export const socket = io(URL, {
  autoConnect: true,

  transports: ["websocket", "polling"],

  reconnection: true,
  reconnectionAttempts: Infinity,

  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,

  timeout: 20000,
});