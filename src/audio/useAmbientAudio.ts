// React hook that keeps the ambient sound in step with the app: whenever the
// weather, the timer, the mixer or the ambient mode changes, it works out the
// new mix (mix.ts) and hands it to the audio engine. Call it once, in App.

import { useEffect, useRef } from 'react';
import { useTimeOfDay } from '../scene/sceneHooks';
import { useSettingsStore } from '../state/settingsStore';
import { useTimerStore } from '../state/timerStore';
import { setMix } from './audioEngine';
import { computeMix, shouldPlayAmbient } from './mix';

const CROSSFADE_MS = 2000; // weather changes, starting, stopping
const SLIDER_MS = 150; // dragging a volume slider should feel instant

export function useAmbientAudio(): void {
  const weather = useSettingsStore((s) => s.theme.weather);
  const layerVolumes = useSettingsStore((s) => s.layerVolumes);
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const ambientMode = useSettingsStore((s) => s.ambientMode);
  const muted = useSettingsStore((s) => s.muted);
  const phase = useTimerStore((s) => s.phase);
  const status = useTimerStore((s) => s.status);
  const timeOfDay = useTimeOfDay();

  const playing = shouldPlayAmbient(ambientMode, muted, phase, status);
  const previousScene = useRef('');

  useEffect(() => {
    // A different weather / time of day / on-off state gets the slow fade.
    const scene = `${weather}|${timeOfDay}|${playing}`;
    const fadeMs = scene === previousScene.current ? SLIDER_MS : CROSSFADE_MS;
    previousScene.current = scene;

    setMix(computeMix({ weather, timeOfDay, layerVolumes, masterVolume, playing }), fadeMs);
  }, [weather, timeOfDay, layerVolumes, masterVolume, playing]);
}
