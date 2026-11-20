// A black cat with yellow eyes that lives on the bench under the shop
// window. It works through a slow routine — sit, loaf, curl up asleep, a
// few minutes each — and, like everything in the scene, which pose it shows
// is worked out from the time alone.
//
// Sprites are text, as in sprites.ts: one string per row, one letter per
// pixel.  b = black fur   h = lighter fur (tail, shut eyes)   y = eye   p = nose
// '-' is a closed eye (drawn in fur colour, so it simply disappears).

import type { Ctx } from '../../draw';
import { drawSprite, type Palette, type Sprite } from '../../sprites';
import { BASE, SHOP_WINDOW } from './layout';

const PALETTE: Palette = { b: '#2b2630', h: '#4d4556', y: '#ffd83d', p: '#f08aa6', '-': '#2b2630' };

const SIT: Sprite = [
  '.b...b....',
  '.bbbbb....',
  '.bybyb....',
  '.bbpbb....',
  '..bbb.....',
  '.bbbbb....',
  '.bbbbb..b.',
  '.bbbbbbbb.',
];
const SIT_BLINK: Sprite = SIT.map((row) => row.replace(/y/g, '-'));

/** The loaf: paws tucked under, like a loaf of bread. */
const LOAF: Sprite = [
  '.b...b....',
  '.bbbbb....',
  '.bybybbbb.',
  '.bbpbbbbbb',
  'bbbbbbbbbb',
  '.bbbbbbbb.',
];
const LOAF_BLINK: Sprite = LOAF.map((row) => row.replace(/y/g, '-'));

/**
 * Curled up asleep: a round ball, head tucked in at the right with the two
 * ears showing, eyes shut (the lighter line), tail wrapped round the front.
 * The two frames lift the back by a pixel: slow breathing.
 */
const CURL: Sprite[] = [
  [
    '...bbbbb....',
    '.bbbbbbbb..b',
    'bbbbbbbbbbbb',
    'bbbbbbbbhhbb',
    'bbbbbbbbbbpb',
    '.hhhhhhbbbb.',
  ],
  [
    '..bbbbbbb...',
    '.bbbbbbbb..b',
    'bbbbbbbbbbbb',
    'bbbbbbbbhhbb',
    'bbbbbbbbbbpb',
    '.hhhhhhbbbb.',
  ],
];

/** Every sprite, for the tests. */
export const BENCH_CAT_SPRITES: Sprite[] = [SIT, SIT_BLINK, LOAF, LOAF_BLINK, ...CURL];

// The routine, repeated: how many seconds each pose lasts (2 to 3 minutes).
const SIT_SECONDS = 150;
const LOAF_SECONDS = 180;
const CURL_SECONDS = 180;
export const BENCH_CAT_ROUTINE_SECONDS = SIT_SECONDS + LOAF_SECONDS + CURL_SECONDS;

/** Which picture the cat shows at time `t` (seconds). `animated` false = always the loaf. */
export function benchCatSprite(t: number, animated: boolean): Sprite {
  if (!animated) return LOAF;
  const time = t % BENCH_CAT_ROUTINE_SECONDS;
  const blinking = t % 4 < 0.2; // a quick blink every 4 seconds
  if (time < SIT_SECONDS) return blinking ? SIT_BLINK : SIT;
  if (time < SIT_SECONDS + LOAF_SECONDS) return blinking ? LOAF_BLINK : LOAF;
  return CURL[Math.floor(t / 2) % 2]; // one breath every 4 seconds
}

export function drawBenchCat(ctx: Ctx, t: number, animated: boolean): void {
  const sprite = benchCatSprite(t, animated);
  const x = SHOP_WINDOW.x + 3;
  const y = BASE - 7 - sprite.length; // paws on the bench's seat
  drawSprite(ctx, sprite, x, y, PALETTE);
}
