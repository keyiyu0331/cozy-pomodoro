// Small original pixel-art sprites, written as text so they are easy to edit:
// each string is one row, each letter is one pixel, '.' is see-through.
// A "palette" says which colour each letter stands for.
//
// All sprites face RIGHT; drawSprite can mirror them to face left.

import { rect, type Ctx } from './draw';

export type Sprite = string[];
export type Palette = Record<string, string>;

export function drawSprite(
  ctx: Ctx,
  sprite: Sprite,
  x: number,
  y: number,
  palette: Palette,
  faceLeft = false,
): void {
  const width = sprite[0].length;
  sprite.forEach((row, rowIndex) => {
    for (let col = 0; col < width; col++) {
      const color = palette[row[col]];
      if (!color) continue; // '.' or an unknown letter: leave see-through
      rect(ctx, Math.round(x) + (faceLeft ? width - 1 - col : col), Math.round(y) + rowIndex, 1, 1, color);
    }
  });
}

// ---------- cat (k = fur, e = eye) ----------

export const CAT_PALETTE: Palette = { k: '#e08a3c', e: '#2b2118' };

export const CAT_WALK: Sprite[] = [
  [
    'k........k.k',
    'k........kkk',
    '.k.......kek',
    '.kkkkkkkkkkk',
    '..kkkkkkkkk.',
    '..kkkkkkkk..',
    '..k.k..k.k..',
  ],
  [
    '.........k.k',
    'kk.......kkk',
    '..k......kek',
    '.kkkkkkkkkkk',
    '..kkkkkkkkk.',
    '..kkkkkkkk..',
    '...kk..kk...',
  ],
];

export const CAT_SIT: Sprite = [
  '......k.k.',
  '......kkk.',
  '......kek.',
  '.....kkkk.',
  '....kkkkk.',
  'k...kkkkk.',
  '.k..kkkkk.',
  '..kkkkkkk.',
];

// ---------- chicken (w = feathers, r = comb, y = beak and legs, e = eye) ----------

export const CHICKEN_PALETTE: Palette = { w: '#fbf6ea', r: '#d2452f', y: '#f0a030', e: '#2b2118' };

export const CHICKEN_STAND: Sprite = [
  '....r..',
  '...ww..',
  '...wey.',
  'wwwww..',
  '.wwww..',
  '..y.y..',
];

export const CHICKEN_PECK: Sprite = [
  '.......',
  '.......',
  'wwwwr..',
  '.wwwww.',
  '..y.wey',
  '..y....',
];

// ---------- bird in flight (b = body), two wing positions ----------

export const BIRD_PALETTE: Palette = { b: '#3a3a4a' };

export const BIRD_FLAP: Sprite[] = [
  ['b...b', '.b.b.', '..b..'],
  ['.....', 'bb.bb', '..b..'],
];
