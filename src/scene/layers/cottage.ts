// Middle layer: the cottage with its chimney smoke.
// Also exports drawLights, which runs AFTER the night tint so that lit
// windows and fireflies stay bright in the dark.

import { COTTAGE_X, GROUND_Y, rand, rect, type Ctx, type Layer } from '../draw';

const WALL = '#e8d2a6';
const TRIM = '#8a5a34';
const DOOR = '#7a4a25';
const GLASS = '#9fd0e8';
const GLOW = '#ffd76a';
const BRICK = '#9a6a55';
const SNOW = '#ffffff';

// Position of the cottage (left edge of the walls, and the base line).
const X = COTTAGE_X;
const BASE = GROUND_Y + 3;
const WALL_W = 50;
const WALL_H = 26;
const WALL_TOP = BASE - WALL_H;
const ROOF_ROWS = 14;
const WINDOWS = [X + 6, X + 34]; // left edges; each window is 10×9

function drawGlass(ctx: Ctx, color: string): void {
  for (const wx of WINDOWS) {
    rect(ctx, wx + 1, WALL_TOP + 9, 8, 7, color);
    rect(ctx, wx + 4, WALL_TOP + 9, 1, 7, TRIM); // the cross bars
    rect(ctx, wx + 1, WALL_TOP + 12, 8, 1, TRIM);
  }
}

export const drawCottage: Layer = (ctx, { season }, t) => {
  // Chimney first, so the roof overlaps its bottom.
  const chimneyX = X + 36;
  const chimneyTop = WALL_TOP - ROOF_ROWS - 4;
  rect(ctx, chimneyX, chimneyTop, 7, 14, BRICK);
  if (season.snow) rect(ctx, chimneyX - 1, chimneyTop - 1, 9, 2, SNOW);

  // Smoke: puffs rise, drift right, grow and fade, then start again.
  for (let i = 0; i < 5; i++) {
    const life = (t * 0.22 + i / 5) % 1; // 0 = just left the chimney, 1 = gone
    const size = 2 + Math.round(life * 3);
    ctx.globalAlpha = (1 - life) * 0.7;
    rect(ctx, chimneyX + 2 + Math.sin(life * 6 + i) * 3 + life * 7, chimneyTop - 3 - life * 26, size, size, '#f4f1ea');
  }
  ctx.globalAlpha = 1;

  // Walls, door, windows.
  rect(ctx, X, WALL_TOP, WALL_W, WALL_H, WALL);
  rect(ctx, X, BASE - 2, WALL_W, 2, TRIM);
  rect(ctx, X + 20, BASE - 15, 10, 15, DOOR);
  rect(ctx, X + 27, BASE - 8, 1, 2, GLOW); // door knob
  for (const wx of WINDOWS) rect(ctx, wx, WALL_TOP + 8, 10, 9, TRIM);
  drawGlass(ctx, GLASS);

  // Roof: rows that get wider towards the bottom, overhanging the walls.
  const centre = X + WALL_W / 2;
  for (let row = 0; row < ROOF_ROWS; row++) {
    const half = 13 + row * 1.4;
    const y = WALL_TOP - ROOF_ROWS + row;
    rect(ctx, centre - half, y, half * 2, 1, season.snow && row < 4 ? SNOW : season.roof);
  }
  rect(ctx, centre - 32, WALL_TOP, 64, 1, season.snow ? SNOW : TRIM); // eaves
};

export const drawLights: Layer = (ctx, { sky, season }, t) => {
  if (sky.windowsLit) {
    drawGlass(ctx, GLOW);
    ctx.globalAlpha = 0.14; // soft halo around each window
    for (const wx of WINDOWS) rect(ctx, wx - 3, WALL_TOP + 5, 16, 15, GLOW);
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
