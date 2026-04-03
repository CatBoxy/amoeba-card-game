export interface Card {
  id: number;
  points: number;
}

// 52 cards mapped from the PDF (pages 8-59)
// Point values: 1 (1 card), 2 (2 cards), 3 (6 cards), 4 (24 cards), 5 (19 cards)
export const CARDS: Card[] = [
  // 4-point cards (cards 1-16, PDF pages 8-23)
  { id: 1, points: 4 },
  { id: 2, points: 4 },
  { id: 3, points: 4 },
  { id: 4, points: 4 },
  { id: 5, points: 4 },
  { id: 6, points: 4 },
  { id: 7, points: 4 },
  { id: 8, points: 4 },
  { id: 9, points: 4 },
  { id: 10, points: 4 },
  { id: 11, points: 4 },
  { id: 12, points: 4 },
  { id: 13, points: 4 },
  { id: 14, points: 4 },
  { id: 15, points: 4 },
  { id: 16, points: 4 },
  // 1-point card (card 17, PDF page 24)
  { id: 17, points: 1 },
  // 2-point cards (cards 18-19, PDF pages 25-26)
  { id: 18, points: 2 },
  { id: 19, points: 2 },
  // 3-point cards (cards 20-25, PDF pages 27-32)
  { id: 20, points: 3 },
  { id: 21, points: 3 },
  { id: 22, points: 3 },
  { id: 23, points: 3 },
  { id: 24, points: 3 },
  { id: 25, points: 3 },
  // 5-point cards (cards 26-44, PDF pages 33-51)
  { id: 26, points: 5 },
  { id: 27, points: 5 },
  { id: 28, points: 5 },
  { id: 29, points: 5 },
  { id: 30, points: 5 },
  { id: 31, points: 5 },
  { id: 32, points: 5 },
  { id: 33, points: 5 },
  { id: 34, points: 5 },
  { id: 35, points: 5 },
  { id: 36, points: 5 },
  { id: 37, points: 5 },
  { id: 38, points: 5 },
  { id: 39, points: 5 },
  { id: 40, points: 5 },
  { id: 41, points: 5 },
  { id: 42, points: 5 },
  { id: 43, points: 5 },
  { id: 44, points: 5 },
  // 4-point cards (cards 45-52, PDF pages 52-59)
  { id: 45, points: 4 },
  { id: 46, points: 4 },
  { id: 47, points: 4 },
  { id: 48, points: 4 },
  { id: 49, points: 4 },
  { id: 50, points: 4 },
  { id: 51, points: 4 },
  { id: 52, points: 4 },
];

export function getCard(id: number): Card | undefined {
  return CARDS.find((c) => c.id === id);
}

export function getCardImagePath(id: number): string {
  return `/cards/card-${id}.png`;
}
