// The one place that knows how windy it is. Everything that shows wind — the
// canopy rustle, the streaks, the loose leaves (and, once this is plugged
// into the scene, grass and rain angle) — asks this file, so they always agree.
//
// A weather has a wind STRENGTH from 0 (dead calm) to 1 (storm), stored in
// themeConfig. The functions below turn that one number into rates.

import type { Weather } from '../types';
import { WEATHERS } from './themeConfig';

export interface Wind {
  strength: number; // 0..1
  direction: 1 | -1; // 1 = blowing to the right, -1 = to the left
}

/** The wind strength a weather aims for. */
export function windForWeather(weather: Weather): number {
  return WEATHERS[weather].wind;
}

/**
 * Move `current` part of the way to `target`, so the wind eases instead of
 * jumping when the weather changes. Called once per frame with the time since
 * the last frame; after about `seconds` it has all but arrived.
 */
export function easeToward(current: number, target: number, dtSeconds: number, seconds = 2): number {
  const share = 1 - Math.exp((-3 * Math.max(0, dtSeconds)) / seconds); // 0..1 of the gap to close
  const next = current + (target - current) * share;
  return Math.abs(target - next) < 0.001 ? target : next;
}

/** A wind that remembers its strength and eases toward a target. */
export function createWind(initialStrength: number) {
  let strength = initialStrength;
  let target = initialStrength;
  return {
    get strength() {
      return strength;
    },
    get target() {
      return target;
    },
    direction: 1 as 1 | -1,
    setTarget(value: number) {
      target = Math.max(0, Math.min(1, value));
    },
    /** Advance by dtSeconds. */
    update(dtSeconds: number) {
      strength = easeToward(strength, target, dtSeconds);
    },
  };
}

// ---------- canopy rustle ----------

/** From this strength up, the canopy rustles non-stop; below it, in short bursts. */
export const CONTINUOUS_FROM = 0.5;

/** Poses per second: 6 normally, 8 in a storm. */
export function rustleFps(strength: number): number {
  return strength >= 0.9 ? 8 : 6;
}

/**
 * Average seconds between rustle bursts in light wind. About 3 s when nearly
 * calm (so, with random jitter, a burst every 2–4 s), shorter as wind picks up.
 */
export function burstPeriod(strength: number): number {
  const closeness = Math.max(0, Math.min(1, strength / CONTINUOUS_FROM)); // 0 calm .. 1 almost continuous
  return 3.4 - closeness * 2.2;
}

// ---------- streaks and leaves ----------

/** New wind streaks per second: ~0.4 in clear weather, ~3 when windy, ~5 in a storm. */
export function streaksPerSecond(strength: number): number {
  return strength <= 0 ? 0 : 0.1 + 4.6 * strength ** 1.5;
}

/** Storm streaks last longer and are longer. */
export function streakScale(strength: number): number {
  return strength >= 0.9 ? 1.5 : 1;
}

/** New loose leaves per second, per tree: rare when clear, ~1 when windy, ~2.5 in a storm. */
export function leavesPerSecond(strength: number): number {
  return strength <= 0 ? 0 : 2.5 * strength ** 2;
}

// ---------- rain and grass ----------

/** How far rain drifts sideways for each pixel it falls: nearly straight in light wind. */
export function rainSlant(strength: number): number {
  return 0.1 + 0.5 * strength;
}

/**
 * How many pixels a blade of grass leans right now: 0, or 1 pixel downwind.
 * Each blade has its own rhythm (`blade` is its number). The stronger the
 * wind, the more of the time it spends leaning and the faster it flicks.
 */
export function grassLean(t: number, blade: number, wind: Wind): number {
  if (wind.strength <= 0) return 0;
  const wave = Math.sin(t * (1.5 + 3 * wind.strength) + blade);
  return wave > 0.9 - 1.2 * wind.strength ? wind.direction : 0;
}
