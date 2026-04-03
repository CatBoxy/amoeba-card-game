"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("amoeba-player-id");
  if (!id) {
    id = uuidv4();
    localStorage.setItem("amoeba-player-id", id);
  }
  return id;
}

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<"home" | "host" | "join">("home");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleHost() {
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    setLoading(true);
    setError("");
    const playerId = getPlayerId();
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId: playerId, hostName: name.trim(), maxPlayers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("amoeba-player-name", name.trim());
      router.push(`/room/${data.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create room");
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    if (!roomCode.trim()) {
      setError("Enter a room code");
      return;
    }
    setLoading(true);
    setError("");
    const playerId = getPlayerId();
    try {
      const res = await fetch(`/api/rooms/${roomCode.toUpperCase()}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, playerName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("amoeba-player-name", name.trim());
      router.push(`/room/${roomCode.toUpperCase()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join room");
      setLoading(false);
    }
  }

  if (view === "home") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-teal-light">
            Amoeba
          </h1>
          <p className="mt-2 text-sm text-slate-400">Card companion</p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={() => setView("host")}
            className="h-14 rounded-2xl bg-teal text-lg font-semibold text-white transition-colors active:bg-teal-dark"
          >
            Host Game
          </button>
          <button
            onClick={() => setView("join")}
            className="h-14 rounded-2xl border-2 border-teal text-lg font-semibold text-teal-light transition-colors active:bg-teal-dark/30"
          >
            Join Game
          </button>
        </div>
      </div>
    );
  }

  if (view === "host") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <button
          onClick={() => { setView("home"); setError(""); }}
          className="absolute left-4 top-4 text-sm text-slate-400"
        >
          &larr; Back
        </button>
        <h2 className="text-2xl font-bold text-teal-light">Host a Game</h2>
        <div className="flex w-full max-w-xs flex-col gap-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className="h-12 rounded-xl bg-slate-800 px-4 text-white placeholder-slate-500 outline-none ring-1 ring-slate-700 focus:ring-teal"
          />
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Number of players
            </label>
            <div className="flex gap-2">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxPlayers(n)}
                  className={`flex-1 h-12 rounded-xl text-lg font-semibold transition-colors ${
                    maxPlayers === n
                      ? "bg-teal text-white"
                      : "bg-slate-800 text-slate-400 ring-1 ring-slate-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={handleHost}
            disabled={loading}
            className="h-14 rounded-2xl bg-teal text-lg font-semibold text-white transition-colors active:bg-teal-dark disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Room"}
          </button>
        </div>
      </div>
    );
  }

  // Join view
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <button
        onClick={() => { setView("home"); setError(""); }}
        className="absolute left-4 top-4 text-sm text-slate-400"
      >
        &larr; Back
      </button>
      <h2 className="text-2xl font-bold text-teal-light">Join a Game</h2>
      <div className="flex w-full max-w-xs flex-col gap-4">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          className="h-12 rounded-xl bg-slate-800 px-4 text-white placeholder-slate-500 outline-none ring-1 ring-slate-700 focus:ring-teal"
        />
        <input
          type="text"
          placeholder="Room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          maxLength={4}
          className="h-12 rounded-xl bg-slate-800 px-4 text-center text-2xl font-mono tracking-[0.3em] text-white placeholder-slate-500 uppercase outline-none ring-1 ring-slate-700 focus:ring-teal"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={handleJoin}
          disabled={loading}
          className="h-14 rounded-2xl bg-teal text-lg font-semibold text-white transition-colors active:bg-teal-dark disabled:opacity-50"
        >
          {loading ? "Joining..." : "Join Room"}
        </button>
      </div>
    </div>
  );
}
