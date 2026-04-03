import { NextResponse } from "next/server";
import { scoreCard } from "@/lib/game";
import { getRoom, setRoom } from "@/lib/store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerId, cardId } = await request.json();

  const room = await getRoom(code.toUpperCase());
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.status !== "playing") {
    return NextResponse.json({ error: "Game not started" }, { status: 400 });
  }

  const result = scoreCard(room, playerId, cardId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await setRoom(code.toUpperCase(), result.state);

  return NextResponse.json({ ok: true, points: result.points });
}
