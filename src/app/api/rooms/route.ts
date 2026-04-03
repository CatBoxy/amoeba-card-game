import { NextResponse } from "next/server";
import { createGame, generateRoomCode } from "@/lib/game";
import { roomExists, setRoom } from "@/lib/store";

export async function POST(request: Request) {
  const { hostId, hostName, maxPlayers } = await request.json();

  if (!hostId || !hostName) {
    return NextResponse.json({ error: "Missing hostId or hostName" }, { status: 400 });
  }

  const playerCount = Math.min(4, Math.max(2, maxPlayers || 2));

  // Generate unique room code
  let code: string;
  let attempts = 0;
  do {
    code = generateRoomCode();
    attempts++;
  } while ((await roomExists(code)) && attempts < 10);

  const state = createGame(hostId, hostName, code, playerCount);
  await setRoom(code, state);

  return NextResponse.json({ code });
}
