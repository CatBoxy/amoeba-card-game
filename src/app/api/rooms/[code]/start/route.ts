import { NextResponse } from "next/server";
import { startGame } from "@/lib/game";
import { getRoom, setRoom } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerId } = await request.json();

  const room = await getRoom(code.toUpperCase());
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.hostId !== playerId) {
    return NextResponse.json({ error: "Only the host can start the game" }, { status: 403 });
  }

  if (room.status === "playing") {
    return NextResponse.json({ error: "Game already started" }, { status: 400 });
  }

  if (room.players.length < 2) {
    return NextResponse.json({ error: "Need at least 2 players" }, { status: 400 });
  }

  const started = startGame(room);
  await setRoom(code.toUpperCase(), started);

  return NextResponse.json({ ok: true });
}
