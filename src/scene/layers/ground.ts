// Front layer: the ground, a dirt path from the cottage door, wind-blown grass
// tufts, and seasonal dots (spring flowers, fallen autumn leaves).

import { COTTAGE_X, GROUND_Y, SCENE_H, SCENE_W, rand, rect, type Layer } from '../draw';
import { grassLean } from '../wind';

const GROUND_H = SCENE_H - GROUND_Y;
const PATH_TOP = GROUND_Y + 3; // the cottage's doorstep

/** The path's centre and width at a given y (it widens as it comes closer). */
function pathAt(y: number): { centre: number; width: number } {
  const down = y - PATH_TOP;
  return { centre: COTTAGE_X + 25 + down * 0.5 + Math.sin(y * 0.15) * 2, width: 9 + down * 0.25 };
}

function onPath(x: number, y: number): boolean {
  if (y < PATH_TOP) return false;
  const { centre, width } = pathAt(y);
  return Math.abs(x - centre) < width / 2 + 2;
}

export const drawGround: Layer = (ctx, { season, wind }, t) => {
  rect(ctx, 0, GROUND_Y, SCENE_W, GROUND_H, season.ground);

  // Texture speckles.
  for (let i = 0; i < 130; i++) {
    rect(ctx, rand(i + 500) * SCENE_W, GROUND_Y + 2 + rand(i + 550) * (GROUND_H - 3), 2, 1, season.groundDark);
  }

  // Path.
  for (let y = PATH_TOP; y < SCENE_H; y++) {
    const { centre, width } = pathAt(y);
    rect(ctx, centre - width / 2, y, width, 1, season.path);
  }

  // Grass tufts: two little blades; the taller one flicks downwind.
  for (let i = 0; i < 80; i++) {
    const x = Math.round(rand(i + 600) * SCENE_W);
    const y = Math.round(GROUND_Y + 4 + rand(i + 650) * (GROUND_H - 6));
    if (onPath(x, y)) continue;
    rect(ctx, x + grassLean(t, i, wind), y - 2, 1, 2, season.blade);
    rect(ctx, x + 1, y - 1, 1, 1, season.blade);
  }

  // Flowers / fallen leaves.
  if (season.groundDots.length > 0) {
    for (let i = 0; i < 46; i++) {
      const x = Math.round(rand(i + 700) * SCENE_W);
      const y = Math.round(GROUND_Y + 4 + rand(i + 750) * (GROUND_H - 6));
      if (onPath(x, y)) continue;
      rect(ctx, x, y, 1, 1, season.groundDots[i % season.groundDots.length]);
      rect(ctx, x, y + 1, 1, 1, season.groundDark);
    }
  }
};
