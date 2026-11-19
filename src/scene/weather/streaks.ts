// Wind streaks: thin pale lines with a slight arc that appear, slide along
// with the wind for a fraction of a second, and fade away.
//
// Like the rest of the scene nothing is remembered between frames. Time is
// cut into small slots; a repeatable "dice roll" per slot decides whether a
// streak is born in it, and everything about that streak (where, how long,
// how fast) comes from the slot's number. Each frame we look at the last few
// slots and draw the streaks that are still alive.

import { rand, type Ctx } from '../draw';
import { streakScale, streaksPerSecond, type Wind } from '../wind';

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SLOTS_PER_SECOND = 10;

export function drawStreaks(ctx: Ctx, area: Area, t: number, wind: Wind, seed = 0): void {
  const rate = streaksPerSecond(wind.strength);
  if (rate <= 0) return;
  const scale = streakScale(wind.strength); // storms: longer lines that live longer
  const longestLife = 0.6 * scale;
  const newestSlot = Math.floor(t * SLOTS_PER_SECOND);
  const oldestSlot = newestSlot - Math.ceil(longestLife * SLOTS_PER_SECOND) - 1;

  for (let slot = oldestSlot; slot <= newestSlot; slot++) {
    const key = slot * 13 + seed * 101;
    if (rand(key) >= rate / SLOTS_PER_SECOND) continue; // no streak born in this slot

    const born = (slot + rand(key + 1)) / SLOTS_PER_SECOND;
    const life = (0.3 + rand(key + 2) * 0.3) * scale;
    const age = t - born;
    if (age < 0 || age >= life) continue;

    const length = Math.round((15 + rand(key + 3) * 15) * scale);
    const speed = 50 + rand(key + 4) * 40; // pixels per second
    const headX = Math.round(area.x + rand(key + 5) * area.width + wind.direction * speed * age);
    const baseY = Math.round(area.y + rand(key + 6) * area.height);
    const arcHeight = 1 + Math.round(rand(key + 7) * 2);
    const arcSide = rand(key + 8) < 0.5 ? -1 : 1;
    const thick = rand(key + 10) < 0.35;

    // Fade in fast, hold, fade out — in steps, not smoothly.
    const progress = age / life;
    const alpha = progress < 0.15 ? 0.4 : progress > 0.75 ? 0.3 : progress > 0.55 ? 0.55 : 0.85;
    ctx.fillStyle = rand(key + 9) < 0.5 ? `rgba(255, 255, 255, ${alpha})` : `rgba(226, 246, 214, ${alpha})`;

    // One pixel per column, trailing behind the head.
    for (let i = 0; i < length; i++) {
      const x = headX - wind.direction * i;
      const y = baseY + arcSide * Math.round(arcHeight * Math.sin((Math.PI * i) / (length - 1)));
      const twoThick = thick && i > length * 0.3 && i < length * 0.7;
      ctx.fillRect(x, y, 1, twoThick ? 2 : 1);
    }
  }
}
