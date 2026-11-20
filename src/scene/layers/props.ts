// A wooden fence running from the left edge of the scene to the house.
// Drawn after the ground so it stands in front of it.

import { GROUND_Y, HOUSE_X, rect, type Layer } from '../draw';

const WOOD = '#c9a57a';
const WOOD_DARK = '#8a5a34';
const SNOW = '#ffffff';
const FENCE_END = HOUSE_X - 8; // stops short of the bush at the house's corner

export const drawProps: Layer = (ctx, { season }) => {
  // Fence: two rails with a post every 6 pixels, left of the house.
  const top = GROUND_Y + 2;
  rect(ctx, 0, top + 2, FENCE_END, 1, WOOD);
  rect(ctx, 0, top + 5, FENCE_END, 1, WOOD);
  for (let x = 1; x < FENCE_END; x += 6) {
    rect(ctx, x, top, 2, 8, WOOD);
    rect(ctx, x + 1, top + 1, 1, 7, WOOD_DARK); // shaded side
    if (season.snow) rect(ctx, x, top - 1, 2, 1, SNOW);
  }

};
