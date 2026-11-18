// Middle layer: leafy trees (which change a lot by season) and evergreen pines.

import { GROUND_Y, disc, rand, rect, type Ctx, type Layer } from '../draw';
import type { SeasonLook } from '../themeConfig';

const SNOW = '#ffffff';

/** Where the trees stand. `size` is a scale factor (1 = small). */
const LEAFY = [
  { x: 12, size: 2 },
  { x: 236, size: 3 },
  { x: 272, size: 2 },
];
const PINES = [
  { x: 150, size: 2 },
  { x: 192, size: 1 },
  { x: 300, size: 3 },
];

function drawLeafyTree(ctx: Ctx, x: number, baseY: number, size: number, look: SeasonLook, t: number): void {
  const trunkW = size + 2;
  const trunkH = 6 * size;
  const top = baseY - trunkH;
  rect(ctx, x - trunkW / 2, top, trunkW, trunkH, look.trunk);

  if (look.leaves.length === 0) {
    // Bare winter tree: a taller trunk with two stepped branches.
    const reach = 4 * size;
    rect(ctx, x - 1, top - reach, 2, reach, look.trunk);
    for (let k = 1; k <= reach; k++) {
      rect(ctx, x - 1 - k, top - k, 1, 1, look.trunk);
      rect(ctx, x + k, top - k, 1, 1, look.trunk);
      if (look.snow && k % 2 === 0) {
        rect(ctx, x - 1 - k, top - k - 1, 1, 1, SNOW);
        rect(ctx, x + k, top - k - 1, 1, 1, SNOW);
      }
    }
    return;
  }

  // Canopy: one big blob plus a shaded and a highlighted smaller blob.
  const [main, highlight, shade] = look.leaves;
  const r = 4 * size + 1;
  const sway = Math.round(Math.sin(t * 0.8 + x) * 0.6); // -1, 0 or 1 pixel
  const cx = x + sway;
  const cy = top - r + 3;
  disc(ctx, cx, cy, r, main);
  disc(ctx, cx - r / 2, cy + 2, r * 0.6, shade);
  disc(ctx, cx + r / 3, cy - r / 3, r * 0.55, highlight);

  if (look.blossom) {
    for (let i = 0; i < 9 * size; i++) {
      const angle = rand(x + i) * Math.PI * 2;
      const distance = rand(x + i + 40) * (r - 1);
      rect(ctx, cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance, 1, 1, look.blossom);
    }
  }
}

function drawPine(ctx: Ctx, x: number, baseY: number, size: number, look: SeasonLook): void {
  const trunkH = 3 * size;
  rect(ctx, x - 1, baseY - trunkH, 2, trunkH, look.trunk);

  // Three stacked triangles, the widest at the bottom.
  const tierH = 4 * size;
  for (let tier = 0; tier < 3; tier++) {
    const maxHalf = (2 + tier * 1.5) * size;
    const tierTop = baseY - trunkH - Math.round(tierH * (3 - tier) * 0.72);
    for (let row = 0; row < tierH; row++) {
      const half = 1 + Math.round((row / tierH) * maxHalf);
      rect(ctx, x - half, tierTop + row, half * 2, 1, look.pine);
      if (look.snow && row === 0) rect(ctx, x - half, tierTop, half * 2, 1, SNOW);
    }
    if (look.snow) rect(ctx, x - maxHalf, tierTop + tierH - 1, size, 1, SNOW);
  }
}

export const drawTrees: Layer = (ctx, { season }, t) => {
  for (const pine of PINES) drawPine(ctx, pine.x, GROUND_Y + 2, pine.size, season);
  for (const tree of LEAFY) drawLeafyTree(ctx, tree.x, GROUND_Y + 2, tree.size, season, t);
};
