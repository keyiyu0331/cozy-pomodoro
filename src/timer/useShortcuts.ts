// Keyboard shortcuts: Space = start/pause, R = reset, S = skip.

import { useEffect } from 'react';
import { useTimerStore } from '../state/timerStore';
import { toggleTimer } from './timerActions';

export function useShortcuts(): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't hijack typing in a field, or combos like Cmd+R (reload).
      const el = e.target as HTMLElement | null;
      if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;

      if (e.code === 'Space') {
        e.preventDefault(); // stops page scroll and "clicking" a focused button
        toggleTimer();
      } else if (e.code === 'KeyR') {
        useTimerStore.getState().reset();
      } else if (e.code === 'KeyS') {
        useTimerStore.getState().skip();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
