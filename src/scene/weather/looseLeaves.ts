// Loose leaves: tiny leaf sprites that break off near the canopy's edge,
// drift with the wind and a little downwards, tumble (by flipping between
// two shapes) and fade out. Uses the same "time slots" idea as streaks.ts.

import { rand, type Ctx } from '../draw';
import { leavesPerSecond, type Wind } from '../wind';

/** The two shapes a leaf flips between as it tumbles ('#' = a pixel). */
const LEAF_FRAMES = [
  ['##.', '.##'],
  ['.#', '##', '#.'],
];

const SLOTS_PER_SECOND = 4;
const LONGEST_LIFE = 2.4;

/**
 * @param canopy where the tree's canopy is: its centre and rough radius
 * @param colors leaf colours for the season; an empty list draws nothing (winter)
 * @param seed   the tree's own number, so each tree sheds at different moments
 */
export function drawLooseLeaves(
  ctx: Ctx,
  canopy: { x: number; y: number; radius: number },
  colors: string[],
  t: number,
  wind: Wind,
  seed: number,
): void {
  const rate = leavesPerSecond(wind.strength);
  if (rate <= 0 || colors.length === 0) return;
  const newestSlot = Math.floor(t * SLOTS_PER_SECOND);
  const oldestSlot = newestSlot - Math.ceil(LONGEST_LIFE * SLOTS_PER_SECOND) - 1;

  for (let slot = oldestSlot; slot <= newestSlot; slot++) {
    const key = slot * 17 + seed * 211;
    if (rand(key) >= rate / SLOTS_PER_SECOND) continue; // no leaf let go in this slot

    const born = (slot + rand(key + 1)) / SLOTS_PER_SECOND;
    const life = 1.4 + rand(key + 2) * (LONGEST_LIFE - 1.4);
    const age = t - born;
    if (age < 0 || age >= life) continue;

    // Start somewhere on the canopy's rim.
    const angle = rand(key + 3) * Math.PI * 2;
    const startX = canopy.x + Math.cos(angle) * canopy.radius;
    const startY = canopy.y + Math.sin(angle) * canopy.radius * 0.9;

    const speed = 18 + 55 * wind.strength + rand(key + 4) * 15;
    const x = Math.round(startX + wind.direction * speed * age);
    const y = Math.round(startY + 7 * age + Math.sin(age * 5 + key) * 2);

    const frame = LEAF_FRAMES[Math.abs(Math.floor(age * 8 + key)) % 2];
    const progress = age / life;
    ctx.globalAlpha = progress > 0.85 ? 0.35 : progress > 0.7 ? 0.65 : 1; // stepped fade-out
    ctx.fillStyle = colors[Math.floor(rand(key + 5) * colors.length)];
    frame.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] === '#') ctx.fillRect(x + rx, y + ry, 1, 1);
      }
    });
  }
  ctx.globalAlpha = 1;
}
