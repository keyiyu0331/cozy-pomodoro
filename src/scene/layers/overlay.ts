// Top layer: a see-through colour wash over everything, e.g. dark blue at
// night or warm orange at sunset — and the white flash of lightning.

import { SCENE_H, SCENE_W, rect, type Layer } from '../draw';
import { flashStrength } from '../weather/lightning';

export const drawOverlay: Layer = (ctx, { sky, weather, animated }, t) => {
  if (sky.tint) rect(ctx, 0, 0, SCENE_W, SCENE_H, sky.tint);

  // No flashing when reduced motion is on.
  if (weather.lightning && animated) {
    const strength = flashStrength(t);
    if (strength > 0) rect(ctx, 0, 0, SCENE_W, SCENE_H, `rgba(255, 255, 255, ${strength})`);
  }
};
