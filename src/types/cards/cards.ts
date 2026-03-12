
export enum Suit {
  Spades   = 'spades',
  Hearts   = 'hearts',
  Diamonds = 'diamonds',
  Clubs    = 'clubs',
}

export enum Rank {
  Six   = '6',
  Seven = '7',
  Eight = '8',
  Nine  = '9',
  Ten   = '10',
  Jack  = 'J',
  Queen = 'Q',
  King  = 'K',
  Ace   = 'A',
}


export const RANK_VALUE: Record<Rank, number> = {
  [Rank.Six]:   6,
  [Rank.Seven]: 7,
  [Rank.Eight]: 8,
  [Rank.Nine]:  9,
  [Rank.Ten]:   10,
  [Rank.Jack]:  11,
  [Rank.Queen]: 12,
  [Rank.King]:  13,
  [Rank.Ace]:   14,
};

export const SUIT_INFO: Record<Suit, { symbol: string; color: string; isRed: boolean }> = {
  [Suit.Spades]:   { symbol: '♠', color: '#1a1a2e', isRed: false },
  [Suit.Hearts]:   { symbol: '♥', color: '#c0392b', isRed: true  },
  [Suit.Diamonds]: { symbol: '♦', color: '#c0392b', isRed: true  },
  [Suit.Clubs]:    { symbol: '♣', color: '#1a1a2e', isRed: false },
};

export interface CardData {
  rank: Rank;
  suit: Suit;
  id: string;
  value: number;
  assetPath: string;
  label: string;
}


export function cardAssetPath(rank: Rank, suit: Suit): string { 
  return `/assets/cards/${rank}_${suit}.svg`;
}

export const CARD_BACK_PATH = '/assets/cards/back.svg';

const RANK_NAMES: Record<Rank, string> = {
  [Rank.Six]:   'Six',
  [Rank.Seven]: 'Seven',
  [Rank.Eight]: 'Eight',
  [Rank.Nine]:  'Nine',
  [Rank.Ten]:   'Ten',
  [Rank.Jack]:  'Jack',
  [Rank.Queen]: 'Queen',
  [Rank.King]:  'King',
  [Rank.Ace]:   'Ace',
};

const SUIT_NAMES: Record<Suit, string> = {
  [Suit.Spades]:   'Spades',
  [Suit.Hearts]:   'Hearts',
  [Suit.Diamonds]: 'Diamonds',
  [Suit.Clubs]:    'Clubs',
};

function buildDeck(): CardData[] {
  const deck: CardData[] = [];
  for (const suit of Object.values(Suit)) {
    for (const rank of Object.values(Rank)) {
      deck.push({
        rank,
        suit,
        id: `${rank}_${suit}`,
        value: RANK_VALUE[rank],
        assetPath: cardAssetPath(rank, suit),
        label: `${RANK_NAMES[rank]} of ${SUIT_NAMES[suit]}`,
      });
    }
  }
  return deck;
}

export const FULL_DECK: readonly CardData[] = buildDeck();

export function getCard(id: string): CardData {
  const card = FULL_DECK.find(c => c.id === id);
  if (!card) throw new Error(`Unknown card id: "${id}"`);
  return card;
}


export interface AssetEntry {
  alias: string;
  src: string;
}

export const CARD_ASSETS: AssetEntry[] = [
  ...FULL_DECK.map(c => ({ alias: c.id, src: c.assetPath })),
  { alias: 'card_back', src: CARD_BACK_PATH },
];

export function canBeat(attacker: CardData, defender: CardData, trumpSuit: Suit): boolean {
  const attackerIsTrump = attacker.suit === trumpSuit;
  const defenderIsTrump = defender.suit === trumpSuit;

  if (attackerIsTrump && defenderIsTrump) {
    return defender.value > attacker.value;
  }
  if (!attackerIsTrump && defenderIsTrump) {
    return true; 
  }
  if (attackerIsTrump && !defenderIsTrump) {
    return false; 
  }
  return defender.suit === attacker.suit && defender.value > attacker.value;
}


export function shuffleDeck(deck: CardData[]): CardData[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


export async function createShuffledDeck(): Promise<CardData[]> {
  return shuffleDeck([...FULL_DECK]);
}


export function selectRandomTrump(deck: CardData[]): CardData{
  const trump = deck[Math.floor(Math.random() * deck.length)];
  return trump;
}

export function lowestTrump(hand: CardData[], trumpSuit: Suit): CardData | null {
  const trumps = hand.filter(c => c.suit === trumpSuit);
  if (trumps.length === 0) return null;
  return trumps.reduce((min, c) => (c.value < min.value ? c : min));
}

export function sortHand(hand: CardData[], trumpSuit: Suit): CardData[] {
  return [...hand].sort((a, b) => {
    const aTrump = a.suit === trumpSuit ? 1 : 0;
    const bTrump = b.suit === trumpSuit ? 1 : 0;
    if (aTrump !== bTrump) return aTrump - bTrump;
    if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
    return a.value - b.value;
  });
}
