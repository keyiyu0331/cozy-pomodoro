// Far background: two rows of rolling hills, drawn one pixel column at a time.

import { GROUND_Y, SCENE_W, rect, type Ctx, type Layer } from '../draw';

/** One wavy ridge. `snowAbove`: paint the top white where it is higher than this y. */
function ridge(
  ctx: Ctx,
  baseY: number,
  height: number,
  frequency: number,
  phase: number,
  color: string,
  snowAbove: number | null,
): void {
  for (let x = 0; x < SCENE_W; x++) {
    const wave = Math.sin(x * frequency + phase) + 0.4 * Math.sin(x * frequency * 2.7 + phase * 2);
    const y = Math.round(baseY - wave * height);
    rect(ctx, x, y, 1, GROUND_Y - y, color);
    if (snowAbove !== null && y < snowAbove) rect(ctx, x, y, 1, 3, '#ffffff');
  }
}

export const drawHills: Layer = (ctx, { season }) => {
  ridge(ctx, 98, 12, 0.02, 1.2, season.hillFar, season.snow ? 92 : null);
  ridge(ctx, 114, 7, 0.035, 4, season.hillNear, null);
};
