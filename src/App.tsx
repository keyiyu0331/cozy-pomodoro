// Top-level layout. Connects the stores and hooks to the visual components:
// reads timer + settings state, works out the time left, and hands plain
// values down to TimerPanel. Also decides which dialog (if any) is showing.
// The pixel scene sits behind everything; the season also recolours the UI.

import { useEffect, useState } from 'react';
import styles from './App.module.css';
import { IntentionDialog } from './components/IntentionDialog';
import { ReflectionDialog } from './components/ReflectionDialog';
import { SettingsView } from './components/SettingsView';
import { ThemePicker } from './components/ThemePicker';
import { TimerPanel } from './components/TimerPanel';
import { TodayPanel } from './components/TodayPanel';
import { Scene } from './scene/Scene';
import { SEASONS } from './scene/themeConfig';
import { useHistoryStore } from './state/historyStore';
import { useSettingsStore } from './state/settingsStore';
import { useTimerStore } from './state/timerStore';
import { useUiStore } from './state/uiStore';
import { handlePhaseEnd, resetTimer, skipTimer, toggleTimer } from './timer/timerActions';
import { formatTime, isFinished, phaseDurationMs, remainingMs } from './timer/timerEngine';
import { useShortcuts } from './timer/useShortcuts';
import { useTicker } from './timer/useTicker';
import { PHASE_LABELS } from './types';

export default function App() {
  const timer = useTimerStore();
  const settings = useSettingsStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const dialog = useUiStore((s) => s.dialog);

  useShortcuts();

  // Read saved history from IndexedDB once, when the app opens.
  // Then delete anything older than the "Keep history for" setting.
  useEffect(() => {
    const history = useHistoryStore.getState();
    void history.load().then(() => history.prune(useSettingsStore.getState().keepHistoryDays));
  }, []);

  // Recolour buttons and panels to match the season, by setting the CSS
  // variables that every stylesheet reads its colours from.
  const season = settings.theme.season;
  useEffect(() => {
    for (const [name, value] of Object.entries(SEASONS[season].ui)) {
      document.documentElement.style.setProperty(name, value);
    }
  }, [season]);

  // Re-render ~4x a second while running, and check whether time is up.
  const tick = useTicker(timer.status === 'running');
  useEffect(() => {
    if (isFinished(useTimerStore.getState(), Date.now())) handlePhaseEnd();
  }, [tick]);

  const fullMs = phaseDurationMs(timer.phase, settings);
  const timeText = formatTime(remainingMs(timer, fullMs, Date.now()));
  const phaseLabel = PHASE_LABELS[timer.phase];

  useEffect(() => {
    document.title = `${timeText} · ${phaseLabel}`;
  }, [timeText, phaseLabel]);

  // Dots under the clock: how far through the "focus sessions until a long
  // break" cycle we are. During a break, the session just finished counts.
  const every = Math.max(1, Math.floor(settings.longBreakEvery));
  const cycleDone =
    timer.phase === 'focus'
      ? timer.focusCount % every
      : ((timer.focusCount - 1) % every) + 1;

  return (
    <>
      <Scene />
      <main className={styles.app} data-phase={timer.phase}>
      <TimerPanel
        phaseLabel={phaseLabel}
        status={timer.status}
        timeText={timeText}
        cycleDone={cycleDone}
        cycleLength={every}
        onToggle={toggleTimer}
        onReset={resetTimer}
        onSkip={skipTimer}
      />

      <ThemePicker />

      <TodayPanel />

      <button
        className={styles.settingsToggle}
        onClick={() => setSettingsOpen((open) => !open)}
        aria-expanded={settingsOpen}
      >
        {settingsOpen ? 'Close settings' : 'Settings'}
      </button>

      {settingsOpen && <SettingsView />}

      {dialog?.kind === 'intention' && <IntentionDialog />}
      {dialog?.kind === 'reflection' && <ReflectionDialog sessionId={dialog.sessionId} />}
      </main>
    </>
  );
}
