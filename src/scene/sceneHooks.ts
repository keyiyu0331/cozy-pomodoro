// Small React hooks that feed the Scene component: the window-size layout,
// the time of day to show, and whether motion should be reduced.

import { useEffect, useState } from 'react';
import { timeOfDayAt } from '../lib/timeOfDay';
import { useSettingsStore } from '../state/settingsStore';
import type { TimeOfDay } from '../types';
import { coverLayout, type SceneLayout } from './scale';

/** Scene size/position for the current window; updates when it is resized. */
export function useSceneLayout(): SceneLayout {
  const measure = () => coverLayout(window.innerWidth, window.innerHeight);
  const [layout, setLayout] = useState(measure);
  useEffect(() => {
    const onResize = () => setLayout(measure());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return layout;
}

/** The chosen time of day; for 'auto', follows the real clock (checked every 30 s). */
export function useTimeOfDay(): TimeOfDay {
  const setting = useSettingsStore((s) => s.theme.timeOfDay);
  const [clock, setClock] = useState(() => timeOfDayAt(new Date()));
  useEffect(() => {
    if (setting !== 'auto') return;
    setClock(timeOfDayAt(new Date()));
    const id = setInterval(() => setClock(timeOfDayAt(new Date())), 30_000);
    return () => clearInterval(id);
  }, [setting]);
  return setting === 'auto' ? clock : setting;
}

/** True if the app setting OR the operating system asks for less motion. */
export function useReducedMotion(): boolean {
  const setting = useSettingsStore((s) => s.reducedMotion);
  const [system, setSystem] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSystem(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return setting || system;
}
