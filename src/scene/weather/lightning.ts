// When lightning strikes. The schedule is worked out from the clock alone
// (no stored state), so the scene's flash and the audio engine's thunder can
// each ask "when is the next strike?" and get the same answer.

import { rand } from '../draw';

/**
 * One strike happens in every period of this many seconds, at a random moment
 * in the period's first third. That puts 30 to 60 seconds between strikes —
 * far enough apart that the single thunder recording doesn't wear thin.
 */
export const STRIKE_PERIOD = 45;
const STRIKE_WINDOW = 15;

/** The moment (in seconds) of the strike in period number `cycle`. */
export function strikeTime(cycle: number): number {
  return cycle * STRIKE_PERIOD + rand(cycle + 900) * STRIKE_WINDOW;
}

/** How bright the flash is at time t: 0 = none. A strike is two quick flickers. */
export function flashStrength(t: number): number {
  const sinceStrike = t - strikeTime(Math.floor(t / STRIKE_PERIOD));
  if (sinceStrike < 0) return 0;
  if (sinceStrike < 0.1) return 0.55;
  if (sinceStrike >= 0.18 && sinceStrike < 0.26) return 0.35;
  return 0;
}
