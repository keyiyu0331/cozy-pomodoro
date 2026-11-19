// Which canopy pose a tree shows at a given moment. Pure: the answer is
// worked out from the time alone, so pausing, stepping and replaying always
// give the same frames.
//
// The poses play as a flipbook — REST, A, REST, B, REST, A ... — each held
// for one "step" (1/6 s normally). There is no in-between: a tree is always
// in exactly one of the three poses.

import { rand } from '../draw';
import { CONTINUOUS_FROM, burstPeriod, rustleFps } from '../wind';

export const REST = 0;
export const POSE_A = 1;
export const POSE_B = 2;
export type PoseIndex = 0 | 1 | 2;

/** The flipbook order. */
export const POSE_SEQUENCE: PoseIndex[] = [REST, POSE_A, REST, POSE_B];

/**
 * @param t        time in seconds
 * @param strength wind strength 0..1 (from wind.ts)
 * @param seed     the tree's own number, so trees don't rustle in step
 * @param fps      poses per second; leave out to let the wind decide (6, or 8 in a storm)
 */
export function rustlePose(t: number, strength: number, seed: number, fps = rustleFps(strength)): PoseIndex {
  if (strength <= 0) return REST;
  const offset = rand(seed + 800) * 10; // this tree's random head start, in seconds
  const time = t + offset;

  if (strength >= CONTINUOUS_FROM) {
    const step = Math.floor(time * fps);
    return POSE_SEQUENCE[((step % 4) + 4) % 4];
  }

  // Light wind: mostly REST, with one short burst (A, REST, B) in each window
  // of time. The burst starts at a random moment in the first two thirds of
  // its window, which makes the gaps between bursts irregular.
  const period = burstPeriod(strength);
  const windowIndex = Math.floor(time / period);
  const burstStart = windowIndex * period + rand(seed + windowIndex * 7.3) * period * 0.66;
  const stepInBurst = Math.floor((time - burstStart) * fps);
  if (stepInBurst === 0) return POSE_A;
  if (stepInBurst === 2) return POSE_B;
  return REST;
}
