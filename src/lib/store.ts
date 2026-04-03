import { Redis } from "@upstash/redis";

export interface GameState {
  code: string;
  hostId: string;
  maxPlayers: number;
  status: "waiting" | "playing";
  players: { id: string; name: string; score: number }[];
  deck: number[]; // remaining card IDs (shuffled)
  hands: Record<string, number[]>; // playerId -> card IDs
  discardPile: number[];
  lastUpdated: number;
}

// In-memory fallback for local development
const memoryStore = new Map<string, string>();

function getRedis(): Redis | null {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

export async function getRoom(code: string): Promise<GameState | null> {
  const redis = getRedis();
  if (redis) {
    return redis.get<GameState>(`room:${code}`);
  }
  const data = memoryStore.get(`room:${code}`);
  return data ? JSON.parse(data) : null;
}

export async function setRoom(code: string, state: GameState): Promise<void> {
  state.lastUpdated = Date.now();
  const redis = getRedis();
  if (redis) {
    // Expire rooms after 24 hours
    await redis.set(`room:${code}`, state, { ex: 86400 });
    return;
  }
  memoryStore.set(`room:${code}`, JSON.stringify(state));
}

export async function roomExists(code: string): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    return (await redis.exists(`room:${code}`)) === 1;
  }
  return memoryStore.has(`room:${code}`);
}
