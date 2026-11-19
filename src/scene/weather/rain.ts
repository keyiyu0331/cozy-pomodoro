// Rain: slanted streaks falling fast. `intensity` (from themeConfig) sets how
// many, and the wind sets how steeply they slant and which way.
//
// Like every particle file here, nothing is remembered between frames: each
// drop's position is calculated from the time alone, then wrapped around.

import { SCENE_H, SCENE_W, rand, rect, type Layer } from '../draw';
import { rainSlant } from '../wind';

export const drawRain: Layer = (ctx, { weather, wind }, t) => {
  const drops = Math.round(90 * weather.intensity);
  const slant = rainSlant(wind.strength) * wind.direction; // sideways drift per pixel fallen
  for (let i = 0; i < drops; i++) {
    const speed = 150 + rand(i + 1000) * 70; // pixels per second
    const y = ((rand(i + 1100) * SCENE_H + t * speed) % (SCENE_H + 8)) - 8;
    const drifted = rand(i + 1200) * SCENE_W + y * slant;
    const x = ((drifted % SCENE_W) + SCENE_W) % SCENE_W; // wrap around both edges
    rect(ctx, x, y, 1, 4, 'rgba(196, 214, 238, 0.6)');
  }
};
