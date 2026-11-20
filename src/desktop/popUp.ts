// Pure rule: should the desktop app's window jump to the front when the
// given phase ends?

import type { Phase, Settings } from '../types';

export const POP_UP_OPTIONS: { id: Settings['popUpWindow']; label: string }[] = [
  { id: 'focusEnd', label: 'When focus ends' },
  { id: 'everyPhase', label: 'When focus or a break ends' },
  { id: 'off', label: 'Never' },
];

/** `endingPhase` is the phase that is running now and about to finish. */
export function shouldPopUp(setting: Settings['popUpWindow'], endingPhase: Phase): boolean {
  if (setting === 'everyPhase') return true;
  if (setting === 'focusEnd') return endingPhase === 'focus';
  return false;
}
