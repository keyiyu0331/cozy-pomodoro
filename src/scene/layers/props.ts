// Small details around the cottage: a wooden fence and window flower boxes.
// Drawn after the ground so they stand in front of it.

import { COTTAGE_X, GROUND_Y, rect, type Layer } from '../draw';

const WOOD = '#c9a57a';
const WOOD_DARK = '#8a5a34';
const SNOW = '#ffffff';

export const drawProps: Layer = (ctx, { season }) => {
  // Fence: two rails with a post every 6 pixels, left of the cottage.
  const top = GROUND_Y + 2;
  rect(ctx, 0, top + 2, COTTAGE_X - 3, 1, WOOD);
  rect(ctx, 0, top + 5, COTTAGE_X - 3, 1, WOOD);
  for (let x = 1; x < COTTAGE_X - 3; x += 6) {
    rect(ctx, x, top, 2, 8, WOOD);
    rect(ctx, x + 1, top + 1, 1, 7, WOOD_DARK); // shaded side
    if (season.snow) rect(ctx, x, top - 1, 2, 1, SNOW);
  }

  // Flower boxes under both windows: flowers in season, snow in winter.
  const boxY = GROUND_Y - 6;
  for (const windowX of [COTTAGE_X + 6, COTTAGE_X + 34]) {
    rect(ctx, windowX - 1, boxY, 12, 2, WOOD_DARK);
    for (let i = 0; i < 5; i++) {
      const color = season.groundDots.length > 0 ? season.groundDots[i % season.groundDots.length] : SNOW;
      rect(ctx, windowX + i * 2, boxY - 1, 1, 1, color);
    }
  }
};
