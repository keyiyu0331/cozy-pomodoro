// Snow: slow flakes that sway from side to side as they fall.

import { SCENE_H, SCENE_W, rand, rect, type Layer } from '../draw';

export const drawSnow: Layer = (ctx, { weather }, t) => {
  const flakes = Math.round(100 * weather.intensity);
  for (let i = 0; i < flakes; i++) {
    const speed = 10 + rand(i + 1300) * 16;
    const y = ((rand(i + 1400) * SCENE_H + t * speed) % (SCENE_H + 4)) - 2;
    const x = rand(i + 1500) * SCENE_W + Math.sin(t * 0.8 + i) * 4;
    const size = rand(i + 1600) > 0.75 ? 2 : 1; // a few bigger, "closer" flakes
    rect(ctx, x, y, size, size, 'rgba(255, 255, 255, 0.92)');
  }
};
