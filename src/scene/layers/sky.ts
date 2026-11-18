// Back layer: sky gradient, stars, sun or moon, drifting clouds.
// In cloudy weather the sun/moon/stars are hidden and there are more clouds.

import { GROUND_Y, SCENE_W, disc, mix, rand, rect, type Layer } from '../draw';

const BANDS = 8; // the gradient is drawn as flat stripes, for a pixel-art look

export const drawSky: Layer = (ctx, { sky, weather }, t) => {
  const clearSky = weather.overcast === null;
  const bandHeight = GROUND_Y / BANDS;
  for (let i = 0; i < BANDS; i++) {
    rect(ctx, 0, i * bandHeight, SCENE_W, bandHeight, mix(sky.top, sky.bottom, i / (BANDS - 1)));
  }

  // Stars: fixed positions, each one blinking off now and then.
  for (let i = 0; i < 70; i++) {
    if (!clearSky || rand(i * 3 + 1) >= sky.starAmount) continue;
    const twinkling = Math.sin(t * 1.5 + i * 2.3) < -0.75;
    if (!twinkling) rect(ctx, rand(i) * SCENE_W, rand(i + 100) * 88, 1, 1, '#ffffff');
  }

  // Sun or moon. The moon gets a "bite" in the sky's colour to make a crescent.
  const { x, y, radius, color, moon } = sky.orb;
  if (clearSky) disc(ctx, x, y, radius, color);
  if (clearSky && moon) disc(ctx, x + 3, y - 2, radius - 1, mix(sky.top, sky.bottom, y / GROUND_Y));

  // Clouds drift slowly to the right and wrap around.
  // Cloudy weather has more of them, and greyer.
  const cloudCount = clearSky ? 4 : 10;
  const cloudColor = clearSky ? sky.cloud : mix(sky.cloud, '#7d8794', 0.5);
  for (let i = 0; i < cloudCount; i++) {
    const span = SCENE_W + 60;
    const cx = ((rand(i + 7) * span + t * (1.2 + (i % 4) * 0.5)) % span) - 30;
    const cy = 14 + (i % 5) * 13 + (i > 4 ? 6 : 0);
    rect(ctx, cx, cy, 22, 5, cloudColor);
    rect(ctx, cx + 4, cy - 3, 12, 3, cloudColor);
    rect(ctx, cx + 6, cy + 5, 13, 2, cloudColor);
  }
};
