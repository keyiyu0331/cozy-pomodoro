// Generates the app icons (PNG files) from a 32×32 pixel drawing written as
// text below: a mug of coffee on a stack of books. Run with:
//   npm run generate-icons
//
// It writes two kinds of icon:
//   public/icons/icon-<size>.png  — square, for the website and phones
//   src-tauri/app-icon.png        — rounded corners with a clear margin, the
//                                   shape macOS expects for a desktop app
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
 * Scale the drawing up and encode it as a PNG of size×size pixels.
 * `margin`: clear space around the drawing, in pixels (0 = edge to edge).
 * `radius`: how rounded the corners are, in pixels (0 = square).
 */
function makePng(size, margin = 0, radius = 0) {
  const inner = size - margin * 2;
  const rowBytes = 1 + size * 4; // each row starts with a "no filter" byte
  const raw = Buffer.alloc(rowBytes * size); // all zero = fully see-through
  for (let y = 0; y < inner; y++) {
    for (let x = 0; x < inner; x++) {
      // Skip pixels outside the rounded corners.
      const cx = Math.max(radius - x, x - (inner - 1 - radius), 0);
      const cy = Math.max(radius - y, y - (inner - 1 - radius), 0);
      if (cx * cx + cy * cy > radius * radius) continue;
      const letter = ART[Math.floor((y * GRID) / inner)][Math.floor((x * GRID) / inner)];
      const rgb = parseInt(COLORS[letter].slice(1), 16);
      const at = (y + margin) * rowBytes + 1 + (x + margin) * 4;
      raw.writeUIntBE(rgb, at, 3);
      raw[at + 3] = 255; // solid
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
writeFileSync(DESKTOP_FILE, makePng(1024, 96, 186));
console.log('  src-tauri/app-icon.png');
