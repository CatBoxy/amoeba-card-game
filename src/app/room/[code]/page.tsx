"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  name: string;
  score: number;
}

interface GameState {
  code: string;
  hostId: string;
  maxPlayers: number;
  status: "waiting" | "playing";
  players: Player[];
  deck: number[];
  hands: Record<string, number[]>;
  discardPile: number[];
}

// Card data duplicated client-side to avoid extra fetches
const CARD_POINTS: Record<number, number> = {};
// 4-point: 1-16, 45-52
for (let i = 1; i <= 16; i++) CARD_POINTS[i] = 4;
for (let i = 45; i <= 52; i++) CARD_POINTS[i] = 4;
// 1-point: 17
CARD_POINTS[17] = 1;
// 2-point: 18-19
CARD_POINTS[18] = 2;
CARD_POINTS[19] = 2;
// 3-point: 20-25
for (let i = 20; i <= 25; i++) CARD_POINTS[i] = 3;
// 5-point: 26-44
for (let i = 26; i <= 44; i++) CARD_POINTS[i] = 5;

function getPlayerId(): string {
  return localStorage.getItem("amoeba-player-id") || "";
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [game, setGame] = useState<GameState | null>(null);
  const [error, setError] = useState("");
  const [scoring, setScoring] = useState<number | null>(null);
  const [scored, setScored] = useState<{ cardId: number; points: number } | null>(null);
  const playerId = useRef("");
  const pollRef = useRef<ReturnType<typeof setInterval>>(null);

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) {
        setError("Room not found");
        return;
      }
      const data: GameState = await res.json();
      setGame(data);
    } catch {
      // Silently retry on network error
    }
  }, [code]);

  useEffect(() => {
    playerId.current = getPlayerId();
    if (!playerId.current) {
      router.push("/");
      return;
    }
    fetchGame();
    pollRef.current = setInterval(fetchGame, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchGame, router]);

  async function handleStart() {
    try {
      const res = await fetch(`/api/rooms/${code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: playerId.current }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      fetchGame();
    } catch {
      setError("Failed to start game");
    }
  }

  async function handleScore(cardId: number) {
    if (scoring !== null) return;
    setScoring(cardId);
    try {
      const res = await fetch(`/api/rooms/${code}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: playerId.current, cardId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setScoring(null);
        return;
      }
      setScored({ cardId, points: data.points });
      setTimeout(() => setScored(null), 1500);
      fetchGame();
    } catch {
      setError("Failed to score");
    } finally {
      setScoring(null);
    }
  }

  if (error && !game) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="text-teal-light underline"
        >
          Go home
        </button>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const isHost = game.hostId === playerId.current;
  const me = game.players.find((p) => p.id === playerId.current);
  const myHand = game.hands[playerId.current] || [];

  // Lobby view
  if (game.status === "waiting") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <button
          onClick={() => router.push("/")}
          className="absolute left-4 top-4 text-sm text-slate-400"
        >
          &larr; Leave
        </button>

        <div className="text-center">
          <p className="text-sm text-slate-400">Room Code</p>
          <p className="text-5xl font-mono font-bold tracking-[0.2em] text-teal-light">
            {game.code}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Share this code with other players
          </p>
        </div>

        <div className="w-full max-w-xs">
          <p className="mb-2 text-sm text-slate-400">
            Players ({game.players.length}/{game.maxPlayers})
          </p>
          <div className="flex flex-col gap-2">
            {game.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3"
              >
                <span className="font-medium text-white">{p.name}</span>
                {p.id === game.hostId && (
                  <span className="text-xs text-teal-light">HOST</span>
                )}
              </div>
            ))}
            {Array.from({ length: game.maxPlayers - game.players.length }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-center rounded-xl border border-dashed border-slate-700 px-4 py-3 text-slate-600"
                >
                  Waiting for player...
                </div>
              )
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {isHost && (
          <button
            onClick={handleStart}
            disabled={game.players.length < 2}
            className="h-14 w-full max-w-xs rounded-2xl bg-teal text-lg font-semibold text-white transition-colors active:bg-teal-dark disabled:opacity-40"
          >
            {game.players.length < 2
              ? "Waiting for players..."
              : "Start Game"}
          </button>
        )}

        {!isHost && !me && (
          <p className="text-sm text-slate-400">
            You are spectating this room
          </p>
        )}
      </div>
    );
  }

  // Game view
  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const deckRemaining = game.deck.length;
  const totalCards = 52;
  const cardsInPlay =
    totalCards - deckRemaining - game.discardPile.length;

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <span className="text-xs text-slate-500">Room </span>
          <span className="font-mono text-sm font-bold text-teal-light">
            {game.code}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-7 items-center rounded-full bg-slate-800 px-3">
            <span className="text-xs text-slate-400">
              Deck: <span className="font-bold text-white">{deckRemaining}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto">
          {sortedPlayers.map((p, i) => (
            <div
              key={p.id}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-xl px-3 py-2 ${
                p.id === playerId.current
                  ? "bg-teal-dark/40 ring-1 ring-teal"
                  : "bg-slate-800"
              }`}
            >
              <span className="truncate text-xs text-slate-400 max-w-full">
                {p.name}
                {p.id === playerId.current ? " (you)" : ""}
              </span>
              <span
                className={`text-2xl font-bold ${
                  i === 0 ? "text-teal-light" : "text-white"
                } ${
                  scored && p.id === playerId.current ? "animate-pulse-score" : ""
                }`}
              >
                {p.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Score toast */}
      {scored && (
        <div className="mx-4 mt-3 flex items-center justify-center rounded-xl bg-emerald-900/60 py-2 text-sm font-semibold text-emerald-300">
          +{scored.points} points!
        </div>
      )}

      {/* My hand */}
      {me ? (
        <div className="flex flex-1 flex-col px-4 pt-4 pb-6">
          <p className="mb-3 text-center text-sm text-slate-400">
            Your hand — tap a card to score it
          </p>
          <div className="flex flex-1 items-center justify-center">
            <div
              className={`grid gap-3 w-full max-w-sm ${
                myHand.length <= 2 ? "grid-cols-2" : "grid-cols-3"
              }`}
            >
              {myHand.map((cardId) => (
                <button
                  key={cardId}
                  onClick={() => handleScore(cardId)}
                  disabled={scoring !== null}
                  className={`relative overflow-hidden rounded-2xl bg-slate-800 transition-transform active:scale-95 ${
                    scoring === cardId ? "opacity-50" : ""
                  }`}
                >
                  <Image
                    src={`/cards/card-${cardId}.png`}
                    alt={`Card worth ${CARD_POINTS[cardId]} points`}
                    width={750}
                    height={1050}
                    className="h-auto w-full"
                    priority
                  />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
                      {CARD_POINTS[cardId]} pts
                    </span>
                  </div>
                </button>
              ))}
              {myHand.length === 0 && (
                <div className="col-span-3 flex flex-col items-center justify-center py-12 text-slate-500">
                  <p className="text-lg font-medium">No cards left</p>
                  <p className="text-sm">The deck is empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-slate-500">
          You are spectating this game
        </div>
      )}

      {/* Game info footer */}
      <div className="border-t border-slate-800 px-4 py-2 text-center text-xs text-slate-500">
        {game.discardPile.length} played &middot; {deckRemaining} in
        deck &middot; {cardsInPlay} in hands
      </div>
    </div>
  );
}
