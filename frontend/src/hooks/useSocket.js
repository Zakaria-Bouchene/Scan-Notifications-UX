import { useEffect, useState } from "react";
import { socket } from "../lib/socket.js";

export function useSocketStatus() {
  const [connected, setConnected] = useState(socket.connected);
  const [transport, setTransport] = useState(socket.io?.engine?.transport?.name || "—");

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      setTransport(socket.io.engine.transport.name);
      socket.io.engine.on("upgrade", (t) => setTransport(t.name));
    };
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return { connected, transport };
}
