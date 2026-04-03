import { NextResponse } from "next/server";
import { getRoom, setRoom } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerId, playerName } = await request.json();

  if (!playerId || !playerName) {
    return NextResponse.json({ error: "Missing playerId or playerName" }, { status: 400 });
  }

  const room = await getRoom(code.toUpperCase());
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.status !== "waiting") {
    return NextResponse.json({ error: "Game already started" }, { status: 400 });
  }

  // Allow rejoining
  const existing = room.players.find((p) => p.id === playerId);
  if (existing) {
    return NextResponse.json({ ok: true });
  }

  if (room.players.length >= room.maxPlayers) {
    return NextResponse.json({ error: "Room is full" }, { status: 400 });
  }

  room.players.push({ id: playerId, name: playerName, score: 0 });
  await setRoom(code.toUpperCase(), room);

  return NextResponse.json({ ok: true });
}
