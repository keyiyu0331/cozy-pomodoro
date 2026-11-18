// Keyboard shortcuts: Space = start/pause, R = reset, S = skip.

import { useEffect } from 'react';
import { useUiStore } from '../state/uiStore';
import { resetTimer, skipTimer, toggleTimer } from './timerActions';

export function useShortcuts(): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Shortcuts are off while a dialog is open.
      if (useUiStore.getState().dialog) return;
      // Don't hijack typing in a field, or combos like Cmd+R (reload).
      const el = e.target as HTMLElement | null;
      if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;

      if (e.code === 'Space') {
        e.preventDefault(); // stops page scroll and "clicking" a focused button
        toggleTimer();
      } else if (e.code === 'KeyR') {
        resetTimer();
      } else if (e.code === 'KeyS') {
        skipTimer();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
