// Middle layer: the house, a two-storey Japanese shop house with tiled
// roofs, ivy and a stovepipe with drifting smoke. This file only puts the
// parts together, back to front; the parts are in the house/ folder.
//
// It exports three layers, because the house is painted at three moments:
//   drawHouse       — the building itself, before the ground
//   drawHouseGarden — bushes, stepping stone, stone lantern, after the ground
//   drawLights      — glowing windows and lanterns, AFTER the night tint so
//                     they stay bright in the dark (plus the fireflies)

import { rand, rect, type Layer } from '../draw';
import { drawGarden, drawStoneLantern } from './house/garden';
import { drawIvy, type Clump } from './house/ivy';
import {
  COLORS as C,
  EAVE_ROWS,
  EAVE_TOP,
  L,
  LANTERN,
  LATTICE_WINDOW,
  PIPE,
  R,
  ROOF_ROWS,
  ROOF_TOP,
  ROUND_WINDOW,
  SHOP_WINDOW,
  UPPER_WINDOW,
  BASE,
} from './house/layout';
import { drawRidge, drawTiledRoof } from './house/roof';
import { drawGlass, drawLantern, drawLowerFloor, drawNoren, drawUpperFloor } from './house/walls';

/** Ivy climbing the two front corners of the house. */
const WALL_IVY: Clump[] = [
  // left corner, ground to upper floor
  { x: L, y: BASE - 9, radius: 8 },
  { x: L - 2, y: BASE - 20, radius: 7 },
  { x: L + 1, y: BASE - 30, radius: 6 },
  { x: L - 4, y: BASE - 35, radius: 5 },
  { x: L + 3, y: BASE - 43, radius: 6 },
  { x: L + 5, y: BASE - 52, radius: 4 },
  // right corner, spilling over the small roof
  { x: R, y: BASE - 10, radius: 8 },
  { x: R + 2, y: BASE - 21, radius: 7 },
  { x: R - 3, y: BASE - 30, radius: 6 },
  { x: R + 4, y: BASE - 36, radius: 5 },
  { x: R - 6, y: BASE - 41, radius: 4 },
  { x: R - 4, y: BASE - 49, radius: 4 },
];

export const drawHouse: Layer = (ctx, { season, state }, t) => {
  // Stovepipe first, so the roof overlaps its foot.
  rect(ctx, PIPE.x, PIPE.top, 3, 16, C.metal[1]);
  rect(ctx, PIPE.x, PIPE.top, 1, 16, C.metal[2]);
  rect(ctx, PIPE.x + 2, PIPE.top, 1, 16, C.metal[0]);
  rect(ctx, PIPE.x - 1, PIPE.top - 2, 5, 2, season.snow ? C.snow : C.metal[0]);

  // Smoke: puffs rise, drift right, grow and fade, then start again.
  for (let i = 0; i < 5; i++) {
    const life = (t * 0.22 + i / 5) % 1; // 0 = just left the pipe, 1 = gone
    const size = 2 + Math.round(life * 3);
    ctx.globalAlpha = (1 - life) * 0.7;
    rect(ctx, PIPE.x + Math.sin(life * 6 + i) * 3 + life * 7, PIPE.top - 5 - life * 26, size, size, '#f4f1ea');
  }
  ctx.globalAlpha = 1;

  drawUpperFloor(ctx);
  drawLowerFloor(ctx);
  drawGlass(ctx, false);
  drawNoren(ctx);

  // Roofs go over the tops of the walls.
  drawTiledRoof(ctx, { top: EAVE_TOP, rows: EAVE_ROWS, left: L, right: R, snowRows: season.snow ? 2 : 0, seed: 5 });
  drawTiledRoof(ctx, { top: ROOF_TOP, rows: ROOF_ROWS, left: L + 8, right: R - 8, snowRows: season.snow ? 6 : 0, seed: 1 });
  drawRidge(ctx, L + 8, R - 8, ROOF_TOP - 2, season.snow);

  drawLantern(ctx, false);
  drawIvy(ctx, WALL_IVY, state.season);
};

export const drawHouseGarden: Layer = (ctx, { season, state }) => {
  drawGarden(ctx, state.season, season.snow);
};

export const drawLights: Layer = (ctx, { sky, season }, t) => {
  if (sky.windowsLit) {
    drawGlass(ctx, true);
    drawLantern(ctx, true);
    drawStoneLantern(ctx, true, season.snow);

    // Soft halos around the brightest lights.
    ctx.globalAlpha = 0.13;
    const uw = UPPER_WINDOW;
    rect(ctx, uw.x - 3, uw.y - 3, uw.panes * (uw.paneW + 1) + 7, uw.h + 6, C.glow);
    rect(ctx, ROUND_WINDOW.x - 8, ROUND_WINDOW.y - 8, 17, 17, C.glow);
    rect(ctx, LATTICE_WINDOW.x - 3, LATTICE_WINDOW.y - 3, LATTICE_WINDOW.w + 6, LATTICE_WINDOW.h + 6, C.glow);
    rect(ctx, SHOP_WINDOW.x - 3, SHOP_WINDOW.y - 3, SHOP_WINDOW.w + 6, SHOP_WINDOW.h + 6, C.glow);
    rect(ctx, LANTERN.x - 4, LANTERN.y - 1, 13, 15, C.lanternLit);
    ctx.globalAlpha = 1;
  }

  if (season.fireflies && sky.starAmount === 1) {
    for (let i = 0; i < 12; i++) {
      const blinkOn = Math.sin(t * 2 + i * 1.7) > -0.2;
      if (!blinkOn) continue;
      const x = 16 + rand(i + 300) * 288 + Math.sin(t * 0.5 + i) * 4;
      const y = 108 + rand(i + 320) * 56 + Math.cos(t * 0.7 + i * 2) * 3;
      rect(ctx, x, y, 1, 1, '#eaff8a');
    }
  }
};
