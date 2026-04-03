import { CARDS } from "./cards";
import { GameState } from "./store";

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createGame(
  hostId: string,
  hostName: string,
  code: string,
  maxPlayers: number
): GameState {
  return {
    code,
    hostId,
    maxPlayers,
    status: "waiting",
    players: [{ id: hostId, name: hostName, score: 0 }],
    deck: [],
    hands: {},
    discardPile: [],
    lastUpdated: Date.now(),
  };
}

export function startGame(state: GameState): GameState {
  const deck = shuffle(CARDS.map((c) => c.id));
  const hands: Record<string, number[]> = {};

  for (const player of state.players) {
    hands[player.id] = deck.splice(0, 3);
  }

  return {
    ...state,
    status: "playing",
    deck,
    hands,
    discardPile: [],
  };
}

export function scoreCard(
  state: GameState,
  playerId: string,
  cardId: number
): { state: GameState; points: number } | { error: string } {
  const hand = state.hands[playerId];
  if (!hand) return { error: "Player not in game" };

  const cardIndex = hand.indexOf(cardId);
  if (cardIndex === -1) return { error: "Card not in hand" };

  const card = CARDS.find((c) => c.id === cardId);
  if (!card) return { error: "Invalid card" };

  // Remove card from hand
  const newHand = [...hand];
  newHand.splice(cardIndex, 1);

  // Draw replacement if deck has cards
  const newDeck = [...state.deck];
  if (newDeck.length > 0) {
    newHand.push(newDeck.shift()!);
  }

  // Update player score
  const newPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, score: p.score + card.points } : p
  );

  return {
    state: {
      ...state,
      deck: newDeck,
      hands: { ...state.hands, [playerId]: newHand },
      players: newPlayers,
      discardPile: [...state.discardPile, cardId],
    },
    points: card.points,
  };
}
