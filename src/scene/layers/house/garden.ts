// Things standing on the ground in front of the house: the door's stepping
// stone, bushes at the corners, a potted plant and a stone lantern. Drawn
// after the ground, so they sit on the grass instead of behind it.

import type { Season } from '../../../types';
import { rect, type Ctx } from '../../draw';
import { drawIvy, type Clump } from './ivy';
import { BASE, COLORS as C, DOOR, L, R, STONE_LANTERN } from './layout';

/** Bushes at the foot of the ivy, left and right of the house. */
const BUSHES: Clump[] = [
  { x: L - 4, y: BASE - 1, radius: 6 },
  { x: L + 3, y: BASE + 1, radius: 4 },
  { x: R + 3, y: BASE - 2, radius: 7 },
  { x: R - 4, y: BASE + 1, radius: 4 },
];

export function drawGarden(ctx: Ctx, season: Season, snow: boolean): void {
  // Stepping stone at the door.
  rect(ctx, DOOR.x - 1, BASE, DOOR.w + 2, 2, C.stone[2]);
  rect(ctx, DOOR.x - 1, BASE + 2, DOOR.w + 2, 1, C.stone[0]);
  rect(ctx, DOOR.x + 3, BASE, 5, 1, C.stone[3]);

  // A potted plant beside the door.
  const potX = DOOR.x - 7;
  drawIvy(ctx, [{ x: potX + 2, y: BASE - 5, radius: 3 }], season);
  rect(ctx, potX, BASE - 2, 5, 3, C.norenShade);
  rect(ctx, potX, BASE - 2, 5, 1, C.noren);

  drawIvy(ctx, BUSHES, season);
  drawStoneLantern(ctx, false, snow);
}

/** A stone garden lantern (toro). `lit` redraws just its little window, glowing. */
export function drawStoneLantern(ctx: Ctx, lit: boolean, snow: boolean): void {
  const { x, y } = STONE_LANTERN; // x = centre, y = foot
  if (lit) {
    rect(ctx, x - 1, y - 12, 3, 3, C.glow);
    return;
  }
  rect(ctx, x - 3, y - 2, 7, 2, C.stone[1]); // base
  rect(ctx, x - 3, y - 2, 7, 1, C.stone[2]);
  rect(ctx, x - 1, y - 8, 3, 6, C.stone[1]); // post
  rect(ctx, x - 1, y - 8, 1, 6, C.stone[2]);
  rect(ctx, x - 3, y - 9, 7, 1, C.stone[2]); // shelf
  rect(ctx, x - 2, y - 13, 5, 4, C.stone[1]); // light box
  rect(ctx, x - 1, y - 12, 3, 3, C.glass);
  rect(ctx, x - 4, y - 15, 9, 2, snow ? C.snow : C.stone[0]); // roof
  rect(ctx, x - 3, y - 16, 7, 1, snow ? C.snow : C.stone[1]);
  rect(ctx, x - 1, y - 18, 3, 2, snow ? C.snowShade : C.stone[2]); // finial
}
