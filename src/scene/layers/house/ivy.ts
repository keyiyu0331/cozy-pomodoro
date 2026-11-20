// Climbing ivy and bushes, drawn as clumps of single-pixel leaves. Each
// clump is a rough circle; a repeatable "dice roll" per pixel decides
// whether a leaf is there and how light it is, so the plant looks leafy but
// never flickers. Colours follow the season: fresh green with blossoms in
// spring, deep green in summer, red and orange in autumn, frosted with snow
// in winter (the same colours as the trees, from TREE_LOOKS).

import type { Season } from '../../../types';
import { rand, type Ctx } from '../../draw';
import { TREE_LOOKS } from '../../themeConfig';

export interface Clump {
  x: number;
  y: number;
  radius: number;
}

export function drawIvy(ctx: Ctx, clumps: Clump[], season: Season): void {
  const look = TREE_LOOKS[season];

  for (const clump of clumps) {
    const r = clump.radius;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy) / r; // 0 centre .. 1 rim
        if (distance > 1) continue;
        const x = clump.x + dx;
        const y = clump.y + dy;
        const roll = rand(x * 13.7 + y * 71.3);

        // Leaves thin out towards the rim.
        if (roll > (distance > 0.8 ? 0.6 : 0.96)) continue;

        // Light comes from the upper left; leaves share a shade in small
        // patches (2×2) so they read as leaves rather than as noise.
        const light = (-dx - dy) / (2 * r); // -1 lower right .. 1 upper left
        const patch = rand(Math.floor(x / 2) * 7.9 + Math.floor(y / 2) * 23.1);
        let tone = Math.round(2 + light * 1.6 + (patch - 0.5) * 2.2);
        tone = Math.max(0, Math.min(4, tone));
        const blossom = look.blossom !== null && rand(x * 3.3 + y * 9.1) > 0.93;
        ctx.fillStyle = blossom ? look.blossom! : look.tones[tone];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}
