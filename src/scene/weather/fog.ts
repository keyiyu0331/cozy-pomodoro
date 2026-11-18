// Fog: wide, pale, see-through banks that drift slowly across the scene.
// Still drawn (without moving) when reduced motion is on.

import { SCENE_W, rand, rect, type Layer } from '../draw';

const FOG = 'rgba(236, 239, 243, 0.2)';

export const drawFog: Layer = (ctx, _theme, t) => {
  for (let i = 0; i < 9; i++) {
    const width = 130 + rand(i + 2400) * 100;
    const span = SCENE_W + width;
    const direction = i % 2 === 0 ? 1 : -1;
    const drift = rand(i + 2500) * span + t * (2 + rand(i + 2600) * 3) * direction;
    const x = (((drift % span) + span) % span) - width;
    const y = 52 + i * 14;
    const height = 9 + rand(i + 2700) * 8;
    // Three stacked slabs make a soft, rounded-looking bank.
    rect(ctx, x, y, width, height, FOG);
    rect(ctx, x + width * 0.12, y - 3, width * 0.76, height + 6, FOG);
    rect(ctx, x + width * 0.3, y - 5, width * 0.4, height + 10, FOG);
  }
};
