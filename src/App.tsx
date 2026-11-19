// Top-level layout. Connects the stores and hooks to the visual components:
// reads timer + settings state, works out the time left, and hands plain
// values down to TimerPanel. Also decides which dialog (if any) is showing.
// The pixel scene sits behind everything; the season also recolours the UI.

import { useEffect, useState } from 'react';
import styles from './App.module.css';
import { useAmbientAudio } from './audio/useAmbientAudio';
import { HistoryView } from './components/HistoryView';
import { IntentionDialog } from './components/IntentionDialog';
import { Mixer } from './components/Mixer';
import { ReflectionDialog } from './components/ReflectionDialog';
import { ReviewDialog } from './components/ReviewDialog';
import { SettingsView } from './components/SettingsView';
import { ThemePicker } from './components/ThemePicker';
import { TimerPanel } from './components/TimerPanel';
import { TodayPanel } from './components/TodayPanel';
import { useReviewPrompt } from './lib/useReviewPrompt';
import { Scene } from './scene/Scene';
import { SEASONS } from './scene/themeConfig';
import { useHistoryStore } from './state/historyStore';
import { useSettingsStore } from './state/settingsStore';
import { useTimerStore } from './state/timerStore';
import { useUiStore } from './state/uiStore';
import { handlePhaseEnd, resetTimer, skipTimer, toggleTimer } from './timer/timerActions';
import { formatTime, isFinished, phaseDurationMs, remainingMs, sessionRange } from './timer/timerEngine';
import { useShortcuts } from './timer/useShortcuts';
import { useTicker } from './timer/useTicker';
import { PHASE_LABELS } from './types';

export default function App() {
  const timer = useTimerStore();
  const settings = useSettingsStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const dialog = useUiStore((s) => s.dialog);

  useShortcuts();
  useAmbientAudio();
  useReviewPrompt();

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

  // While the timer isn't running nothing else redraws the screen, so nudge
  // it every 10 seconds to keep the "from → to" clock times up to date.
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setClockTick((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const fullMs = phaseDurationMs(timer.phase, settings);
  const timeText = formatTime(remainingMs(timer, fullMs, Date.now()));
  const phaseLabel = PHASE_LABELS[timer.phase];

  // The clock times this phase runs from and to, e.g. "11:45 AM → 12:10 PM".
  const range = sessionRange(timer, fullMs, Date.now());
  const clockTime = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const rangeText = `${clockTime(range.start)} → ${clockTime(range.end)}`;

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
        rangeText={rangeText}
        cycleDone={cycleDone}
        cycleLength={every}
        onToggle={toggleTimer}
        onReset={resetTimer}
        onSkip={skipTimer}
      />

      <ThemePicker />

      <Mixer />

      <TodayPanel />

      <div className={styles.toggles}>
        <button
          className={styles.settingsToggle}
          onClick={() => setHistoryOpen((open) => !open)}
          aria-expanded={historyOpen}
        >
          {historyOpen ? 'Close history' : 'History'}
        </button>
        <button
          className={styles.settingsToggle}
          onClick={() => setSettingsOpen((open) => !open)}
          aria-expanded={settingsOpen}
        >
          {settingsOpen ? 'Close settings' : 'Settings'}
        </button>
      </div>

      {historyOpen && <HistoryView />}
      {settingsOpen && <SettingsView />}

      {dialog?.kind === 'intention' && <IntentionDialog />}
      {dialog?.kind === 'reflection' && <ReflectionDialog sessionId={dialog.sessionId} />}
      {dialog?.kind === 'review' && <ReviewDialog date={dialog.date} />}
      </main>
    </>
  );
}
