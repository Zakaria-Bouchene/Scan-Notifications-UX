import { Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Scanner from "./pages/Scanner.jsx";
import Notifications from "./pages/Notifications.jsx";
import Login from "./pages/Login.jsx";
import { useSocketStatus } from "./hooks/useSocket.js";
import { socket } from "./lib/socket.js";

const navItem = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition ${
    isActive
      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
      : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
  }`;

export default function App() {
  const { connected, transport } = useSocketStatus();
  const [user, setUser] = useState(() => localStorage.getItem("user") || "");
  const [dark, setDark] = useState(() => localStorage.getItem("dark") === "1");
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("dark", dark ? "1" : "0");
  }, [dark]);

  // re-auth on reconnect
  useEffect(() => {
    if (!user) return;
    const reAuth = () => socket.emit("auth:login", { username: user });
    if (socket.connected) reAuth();
    socket.on("connect", reAuth);
    return () => socket.off("connect", reAuth);
  }, [user]);

  function handleLogin(u) {
    localStorage.setItem("user", u);
    setUser(u);
    socket.emit("auth:login", { username: u }, () => navigate("/notifications"));
  }

  function handleLogout() {
    localStorage.removeItem("user");
    setUser("");
    socket.disconnect();
    socket.connect();
    navigate("/login");
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold">
            <div className="h-7 w-7 rounded-md bg-sky-500 grid place-items-center text-white text-xs font-bold">L</div>
            <span>LogiTest</span>
          </div>
          <nav className="flex items-center gap-1 ml-4">
            <NavLink to="/scanner" className={navItem}>Scanner</NavLink>
            <NavLink to="/notifications" className={navItem}>Notifications</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-rose-500"} ${connected ? "animate-pulse" : ""}`} />
              {connected ? `online · ${transport}` : "offline"}
            </span>
            {user ? (
              <>
                <span className="font-medium">{user}</span>
                <button onClick={handleLogout} className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/login" className="px-2 py-1 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900">Login</NavLink>
            )}
            <button
              onClick={() => setDark((d) => !d)}
              className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700"
              title="Toggle dark mode"
            >
              {dark ? "☀" : "☾"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/scanner" replace />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/login" element={<Login onLogin={handleLogin} currentUser={user} />} />
          <Route
            path="/notifications"
            element={user ? <Notifications user={user} /> : <Navigate to="/login" replace />}
          />
          <Route path="*" element={<div className="text-center py-20 text-slate-500">404 — not found</div>} />
        </Routes>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-xs text-slate-500">
        Test harness · Two tabs = two users · Watch the status badges
      </footer>
    </div>
  );
}
