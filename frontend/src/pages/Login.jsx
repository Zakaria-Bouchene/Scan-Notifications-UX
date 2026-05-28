import { useState } from "react";

const USERS = ["user1", "user2"];

export default function Login({ onLogin, currentUser }) {
  const [picked, setPicked] = useState(currentUser || "");

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm animate-pop">
        <h1 className="text-xl font-semibold">Pick a test user</h1>
        <p className="text-sm text-slate-500 mt-1">
          No password. Open this app in another tab/browser and log in as the other user.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-5">
          {USERS.map((u) => (
            <button
              key={u}
              onClick={() => setPicked(u)}
              className={`p-4 rounded-xl border text-left transition ${
                picked === u
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 ring-2 ring-sky-500/30"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-400"
              }`}
            >
              <div className="font-semibold">{u}</div>
              <div className="text-xs text-slate-500">tap to select</div>
            </button>
          ))}
        </div>

        <button
          disabled={!picked}
          onClick={() => onLogin(picked)}
          className="mt-5 w-full rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 py-2.5 font-medium disabled:opacity-40"
        >
          Continue as {picked || "…"}
        </button>
      </div>
    </div>
  );
}
