// The weather layer: dims the scene for cloudy weather, then draws whichever
// particle effects the current weather lists in themeConfig.
//
// To add a new effect: write its file, add it to PARTICLES below, and name it
// in a weather's `particles` list in themeConfig.ts.

import { SCENE_H, SCENE_W, rect, type Layer } from '../draw';
import { drawFog } from './fog';
import { drawLeaves } from './leaves';
import { drawRain } from './rain';
import { drawSnow } from './snow';

interface ParticleEffect {
  draw: Layer;
  /** Draw it (frozen) even when reduced motion is on? */
  showWhenStill: boolean;
}

export const PARTICLES: Record<string, ParticleEffect> = {
  rain: { draw: drawRain, showWhenStill: false },
  snow: { draw: drawSnow, showWhenStill: false },
  leaves: { draw: drawLeaves, showWhenStill: false },
  fog: { draw: drawFog, showWhenStill: true },
};

export const drawWeather: Layer = (ctx, theme, t) => {
  const { weather, animated } = theme;
  if (weather.overcast) rect(ctx, 0, 0, SCENE_W, SCENE_H, weather.overcast);

  for (const name of weather.particles) {
    const effect = PARTICLES[name];
    if (!effect) continue;
    if (animated || effect.showWhenStill) effect.draw(ctx, theme, t);
  }
};
