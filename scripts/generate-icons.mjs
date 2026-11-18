// Generates the app icons (PNG files) in public/icons/ from a 16×16 pixel
// drawing written as text below. Run with:  npm run generate-icons
//
// No image library needed: a PNG is just a small header plus the pixel rows
// compressed with zlib, which Node has built in.

import { mkdirSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';

const OUT_DIR = new URL('../public/icons/', import.meta.url);

// One letter per pixel. The sky and grass run to the edges so the icon still
// looks right when a phone crops it into a circle ("maskable").
const ART = [
  'ssssssssssssssss',
  'ssssssssssssssss',
  'ssssssssssmsssss',
  'sssssssssscsssss',
  'ssssssrrrrcsssss',
  'sssssrrrrrrrssss',
  'ssssrrrrrrrrrsss',
  'sssrrrrrrrrrrrss',
  'sssswwwwwwwwwsss',
  'sssswyywwwddwsss',
  'sssswyywwwddwsss',
  'sssswwwwwwddwsss',
  'gggggggggggppggg',
  'ggggggggggpppggg',
  'gggggggggppppggg',
  'gggggggggppppggg',
];
const COLORS = {
  s: '#8fc7e8', // sky
  m: '#f4f1ea', // smoke
  c: '#9a6a55', // chimney
  r: '#b5533c', // roof
  w: '#e8d2a6', // wall
  y: '#ffd76a', // lit window
  d: '#7a4a25', // door
  g: '#8fce6a', // grass
  p: '#d9b98a', // path
};

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

/** Scale the 16×16 drawing up to size×size and encode it as a PNG. */
function makePng(size) {
  const rowBytes = 1 + size * 3; // each row starts with a "no filter" byte
  const raw = Buffer.alloc(rowBytes * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const letter = ART[Math.floor((y * 16) / size)][Math.floor((x * 16) / size)];
      const rgb = parseInt(COLORS[letter].slice(1), 16);
      raw.writeUIntBE(rgb, y * rowBytes + 1 + x * 3, 3);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8 bits per channel, RGB colour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [32, 180, 192, 512]) {
  writeFileSync(new URL(`icon-${size}.png`, OUT_DIR), makePng(size));
  console.log(`  icon-${size}.png`);
}
