import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'assets', 'cards');

mkdirSync(OUT_DIR, { recursive: true });

// Durak deck: 36 cards
const RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = [
  { id: 'spades',   symbol: '♠', color: '#1a1a2e' },
  { id: 'hearts',   symbol: '♥', color: '#c0392b' },
  { id: 'diamonds', symbol: '♦', color: '#c0392b' },
  { id: 'clubs',    symbol: '♣', color: '#1a1a2e' },
];

// Card dimensions (pixel-art proportions)
const W = 80;
const H = 112;

// Pixel art suit icons (7x7 grid, 1=filled)
const SUIT_PIXELS = {
  spades: [
    [0,0,0,1,0,0,0],
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,0,1,1,1,0,0],
    [0,1,1,0,1,1,0],
  ],
  hearts: [
    [0,1,1,0,1,1,0],
    [1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0],
    [0,0,0,0,0,0,0],
  ],
  diamonds: [
    [0,0,0,1,0,0,0],
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0],
  ],
  clubs: [
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [0,0,1,1,1,0,0],
    [0,1,1,0,1,1,0],
  ],
};

function renderPixelGrid(pixels, x, y, pixelSize, color) {
  let rects = '';
  for (let row = 0; row < pixels.length; row++) {
    for (let col = 0; col < pixels[row].length; col++) {
      if (pixels[row][col]) {
        rects += `<rect x="${x + col * pixelSize}" y="${y + row * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
      }
    }
  }
  return rects;
}

// Pixel font digits/letters for rank (5x7 grid)
const PIXEL_CHARS = {
  '6': [[0,1,1,1,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  '7': [[1,1,1,1,1],[0,0,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,1,0,0,0]],
  '8': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  '9': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[0,0,0,0,1],[0,1,1,1,0]],
  '0': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,1,1],[1,0,1,0,1],[1,1,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  '1': [[0,0,1,0,0],[0,1,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0]],
  'J': [[0,0,0,1,0],[0,0,0,1,0],[0,0,0,1,0],[0,0,0,1,0],[1,0,0,1,0],[1,0,0,1,0],[0,1,1,0,0]],
  'Q': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,1,0],[0,1,1,0,1]],
  'K': [[1,0,0,0,1],[1,0,0,1,0],[1,0,1,0,0],[1,1,0,0,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
  'A': [[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
};

function renderRankPixels(rank, x, y, pixelSize, color) {
  let rects = '';
  if (rank === '10') {
    // render '1' then '0' side by side
    const char1 = PIXEL_CHARS['1'];
    const char0 = PIXEL_CHARS['0'];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (char1[row][col]) rects += `<rect x="${x + col * pixelSize}" y="${y + row * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
      }
    }
    const offsetX = 6 * pixelSize;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (char0[row][col]) rects += `<rect x="${x + offsetX + col * pixelSize}" y="${y + row * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
      }
    }
  } else {
    const char = PIXEL_CHARS[rank];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (char[row][col]) rects += `<rect x="${x + col * pixelSize}" y="${y + row * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
      }
    }
  }
  return rects;
}

function generateCard(rank, suit) {
  const px = 1; // pixel size for rank
  const suitPx = 4; // pixel size for center suit icon
  const color = suit.color;

  // Rank pixel art top-left corner
  const rankTopX = 5;
  const rankTopY = 5;

  // Small suit mark under rank (top-left)
  const smallSuitPx = 2;
  const smallSuitX = 6;
  const smallSuitY = rankTopY + 10;

  // Center suit icon
  const suitW = 7 * suitPx;
  const suitH = 7 * suitPx;
  const suitCX = Math.floor((W - suitW) / 2);
  const suitCY = Math.floor((H - suitH) / 2);

  // Border pixels (checkerboard pixel-art border)
  const borderColor = color;
  
  const rankTopPixels = renderRankPixels(rank, rankTopX, rankTopY, px, color);
  const rankBottomPixels = renderRankPixels(rank, W - rankTopX - (rank === '10' ? 11 : 5) * px, H - rankTopY - 7 * px, px, color);

  const centerSuit = renderPixelGrid(SUIT_PIXELS[suit.id], suitCX, suitCY, suitPx, color);
  const smallSuitTop = renderPixelGrid(SUIT_PIXELS[suit.id], smallSuitX, smallSuitY, smallSuitPx, color);
  const smallSuitBot = renderPixelGrid(SUIT_PIXELS[suit.id], W - smallSuitX - 7 * smallSuitPx, H - smallSuitY - 7 * smallSuitPx, smallSuitPx, color);

  // Pixel art outer border (2px thick, crisp)
  const borderRects = `
    <rect x="0" y="0" width="${W}" height="2" fill="${borderColor}"/>
    <rect x="0" y="${H-2}" width="${W}" height="2" fill="${borderColor}"/>
    <rect x="0" y="0" width="2" height="${H}" fill="${borderColor}"/>
    <rect x="${W-2}" y="0" width="2" height="${H}" fill="${borderColor}"/>
    <rect x="2" y="2" width="${W-4}" height="2" fill="${borderColor}" opacity="0.3"/>
    <rect x="2" y="${H-4}" width="${W-4}" height="2" fill="${borderColor}" opacity="0.3"/>
    <rect x="2" y="2" width="2" height="${H-4}" fill="${borderColor}" opacity="0.3"/>
    <rect x="${W-4}" y="2" width="2" height="${H-4}" fill="${borderColor}" opacity="0.3"/>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" shape-rendering="crispEdges">
  <!-- Card background -->
  <rect width="${W}" height="${H}" fill="#f5f0e8"/>
  <!-- Pixel border -->
  ${borderRects}
  <!-- Rank top-left -->
  ${rankTopPixels}
  <!-- Small suit top-left -->
  ${smallSuitTop}
  <!-- Center suit -->
  ${centerSuit}
  <!-- Rank bottom-right (rotated via transform) -->
  <g transform="rotate(180, ${W/2}, ${H/2})">
    ${rankTopPixels}
    ${smallSuitTop}
  </g>
</svg>`;
}

function generateBack() {
  const tileSize = 8;
  let tiles = '';
  const cols = W / tileSize;
  const rows = H / tileSize;
  const colors = ['#1a1a2e', '#16213e', '#0f3460', '#1a1a2e'];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const colorIndex = (r + c) % colors.length;
      tiles += `<rect x="${c * tileSize}" y="${r * tileSize}" width="${tileSize}" height="${tileSize}" fill="${colors[colorIndex]}"/>`;
    }
  }

  // Pixel art diamond pattern overlay
  let diamonds = '';
  for (let r = 1; r < rows; r += 2) {
    for (let c = 1; c < cols; c += 2) {
      diamonds += `<rect x="${c * tileSize - 2}" y="${r * tileSize - 2}" width="4" height="4" fill="#e94560" opacity="0.8"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" shape-rendering="crispEdges">
  ${tiles}
  ${diamonds}
  <!-- Border -->
  <rect x="0" y="0" width="${W}" height="2" fill="#e94560"/>
  <rect x="0" y="${H-2}" width="${W}" height="2" fill="#e94560"/>
  <rect x="0" y="0" width="2" height="${H}" fill="#e94560"/>
  <rect x="${W-2}" y="0" width="2" height="${H}" fill="#e94560"/>
</svg>`;
}

// Generate all 36 cards
let count = 0;
for (const suit of SUITS) {
  for (const rank of RANKS) {
    const svg = generateCard(rank, suit);
    const filename = `${rank}_${suit.id}.svg`;
    writeFileSync(join(OUT_DIR, filename), svg);
    count++;
  }
}

// Generate card back
writeFileSync(join(OUT_DIR, 'back.svg'), generateBack());

console.log(`✓ Generated ${count} card SVGs + 1 back → public/assets/cards/`);
