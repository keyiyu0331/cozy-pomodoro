// Middle layer: the evergreen pines in the distance. (The big leafy trees,
// which rustle in the wind, are drawn by layers/windTrees.ts.)

import { GROUND_Y, rect, type Ctx, type Layer } from '../draw';
import type { SeasonLook } from '../themeConfig';

const SNOW = '#ffffff';

/** Where the pines stand. `size` is a scale factor (1 = small). */
const PINES = [
  { x: 150, size: 2 },
  { x: 192, size: 1 },
  { x: 300, size: 3 },
];

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

export const drawTrees: Layer = (ctx, { season }) => {
  for (const pine of PINES) drawPine(ctx, pine.x, GROUND_Y + 2, pine.size, season);
};
