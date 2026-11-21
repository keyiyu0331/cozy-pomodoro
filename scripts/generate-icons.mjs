// Generates the app icons (PNG files) from a 32×32 pixel drawing written as
// text below: a mug of coffee on a stack of books. Run with:
//   npm run generate-icons
//
// It writes two kinds of icon:
//   public/icons/icon-<size>.png  — square, for the website and phones
//   src-tauri/app-icon.png        — rounded corners, a clear margin and a soft
//                                   shadow, as macOS expects for a desktop app
// After changing the drawing, also run `npx tauri icon src-tauri/app-icon.png`
// to rebuild the desktop app's icon files from the second one.
//
// No image library needed: a PNG is just a small header plus the pixel rows
// compressed with zlib, which Node has built in.

import { mkdirSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';

const WEB_DIR = new URL('../public/icons/', import.meta.url);
const DESKTOP_FILE = new URL('../src-tauri/app-icon.png', import.meta.url);

// One letter per pixel. The background runs to the edges and the drawing
// stays near the middle, so the icon still looks right when a phone crops it
// into a circle ("maskable").
const ART = [
  '................................',
  '..............w...w.............',
  '...............w.w..............',
  '..............w...w........y....',
  '..........................yyy...',
  '...........BkKKKkkkkB......y....',
  '...........cbbbbbbbbB........y..',
  '.....y.....cbbbbbbbbBBBB........',
  '....yyy....cbbbggbbbB..B........',
  '.....y.....cbbOooobbB..B...gg...',
  '...........cbboooobbB..B..ggG...',
  '..y........cbbbooDbbBBBB..gGg...',
  '...........cbbbbbbbbB....gGg....',
  '...........BBBBBBBBBB...GG......',
  '.......Ppppyyppppppppppppp......',
  '.......Pppwwwwwwwwwwwwwwww......',
  '.......Pyyeeeeeeeeeeeeeeew......',
  '.......Pppwwwwwwwwwwwwwwww......',
  '.......PPPPPPPPPPPPPPPPPPP......',
  '....Rrrrwwrrrrrrrrrrrrrrrr......',
  '....Rrrwwwwwwwwwwwwwwwwwww......',
  '....Rwweeeeeeeeeeeeeeeeeew......',
  '....Rrrwwwwwwwwwwwwwwwwwww......',
  '....RRRRRRRRRRRRRRRRRRRRRR......',
  '......Ttttyyttttttttttttttt.....',
  '......Tttwwwwwwwwwwwwwwwwww.....',
  '......Tyyeeeeeeeeeeeeeeeeew.....',
  '......Tttwwwwwwwwwwwwwwwwww.....',
  '......TTTTTTTTTTTTTTTTTTTTT.....',
  '.....sssssssssssssssssssssss....',
  '................................',
  '................................',
];
const GRID = ART.length;
const COLORS = {
  '.': '#fff0dc', // background
  s: '#ecd6bd', // shadow under the books
  w: '#fffaf0', // pages, steam
  e: '#e9d9bf', // page lines
  y: '#ffd23e', // sparkles, bookmarks
  p: '#b79cf0', // purple book
  P: '#7f62c4',
  r: '#f79ab8', // pink book
  R: '#d0628a',
  t: '#7fd8c4', // teal book
  T: '#3fa894',
  b: '#6fbcf0', // mug
  c: '#a8dbff',
  B: '#3f84c8',
  k: '#8a5a3c', // coffee
  K: '#b07d55',
  o: '#ef5a45', // the tomato on the mug (pomodoro!)
  O: '#ff8a75',
  D: '#c23a2c',
  g: '#6fcf5a', // leaves, tomato stalk
  G: '#3f9a45',
};

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

/**
 * How far a point is from the edge of a rounded square, in pixels:
 * negative inside, 0 on the edge, positive outside.
 * The square's top-left corner is at (left, top) and its sides are `side` long.
 */
function distanceToRoundedSquare(x, y, left, top, side, radius) {
  const half = side / 2;
  const qx = Math.abs(x + 0.5 - (left + half)) - (half - radius);
  const qy = Math.abs(y + 0.5 - (top + half)) - (half - radius);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - radius;
}

// The soft shadow under a desktop icon, like other Mac apps have: black,
// shifted down a little, fading out over a few dozen pixels.
const SHADOW = { down: 12, reach: 30, strength: 0.42 };

/**
 * Scale the drawing up and encode it as a PNG of size×size pixels.
 * `margin`: clear space around the drawing, in pixels (0 = edge to edge).
 * `radius`: how rounded the corners are, in pixels (0 = square).
 * `shadow`: true paints a soft drop shadow in the margin (needs a margin).
 */
function makePng(size, margin = 0, radius = 0, shadow = false) {
  const inner = size - margin * 2;
  const rowBytes = 1 + size * 4; // each row starts with a "no filter" byte
  const raw = Buffer.alloc(rowBytes * size); // all zero = fully see-through
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const at = y * rowBytes + 1 + x * 4;
      if (distanceToRoundedSquare(x, y, margin, margin, inner, radius) <= 0) {
        // Inside the icon's shape: a pixel of the drawing.
        const letter = ART[Math.floor(((y - margin) * GRID) / inner)][Math.floor(((x - margin) * GRID) / inner)];
        raw.writeUIntBE(parseInt(COLORS[letter].slice(1), 16), at, 3);
        raw[at + 3] = 255; // solid
      } else if (shadow) {
        // Outside it: black, more see-through the further from the shape
        // (measured from a copy of the shape moved down a little).
        const d = distanceToRoundedSquare(x, y, margin, margin + SHADOW.down, inner, radius);
        const fade = Math.min(1, Math.max(0, (d + 20) / (SHADOW.reach + 20))); // 0 near .. 1 far
        const smooth = fade * fade * (3 - 2 * fade);
        raw[at + 3] = Math.round(255 * SHADOW.strength * (1 - smooth));
      }
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8 bits per channel, RGB + see-through
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(WEB_DIR, { recursive: true });
for (const size of [32, 180, 192, 512]) {
  writeFileSync(new URL(`icon-${size}.png`, WEB_DIR), makePng(size));
  console.log(`  public/icons/icon-${size}.png`);
}
// 1024 with a 96-pixel margin leaves 832 = 26 × 32, so every drawing pixel
// becomes an exact 26×26 block.
writeFileSync(DESKTOP_FILE, makePng(1024, 96, 186, true));
console.log('  src-tauri/app-icon.png');
