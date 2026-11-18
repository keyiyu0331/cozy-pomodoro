// Turns a clock time into one of the four times of day (used when the
// time-of-day setting is 'auto').

import type { TimeOfDay } from '../types';

export function timeOfDayAt(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
