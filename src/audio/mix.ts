// Pure functions that decide how loud every sound layer should be right now.
// No sound is played here — audioEngine.ts takes these numbers and does that.
//
// Your mixer changes are saved per weather, under keys like "rain:fire", so
// adding a fireplace to Rain doesn't also add it to Clear.

import type { Phase, Settings, TimeOfDay, Weather } from '../types';
import type { TimerStatus } from '../timer/timerEngine';
import { LAYER_ORDER, WEATHER_SOUNDS } from './soundConfig';

export function mixKey(weather: Weather, layerId: string): string {
  return `${weather}:${layerId}`;
}

/**
 * Slider position (0..1) of every layer for this weather: your saved value
 * if you moved that slider, otherwise the weather's default (0 = silent).
 */
export function layerLevels(
  weather: Weather,
  timeOfDay: TimeOfDay,
  layerVolumes: Record<string, number>,
): Record<string, number> {
  const sounds = WEATHER_SOUNDS[weather];
  const defaults = (timeOfDay === 'night' && sounds.night) || sounds.day;
  const levels: Record<string, number> = {};
  for (const id of LAYER_ORDER) {
    levels[id] = layerVolumes[mixKey(weather, id)] ?? defaults[id] ?? 0;
  }
  return levels;
}

/** Should ambient sound be playing at all, given the mode and the timer? */
export function shouldPlayAmbient(
  mode: Settings['ambientMode'],
  muted: boolean,
  phase: Phase,
  status: TimerStatus,
): boolean {
  if (muted || mode === 'off') return false;
  if (mode === 'always') return true;
  return phase === 'focus' && status === 'running'; // 'focusOnly'
}

/** Final volume of every layer: slider × master, or all zero when not playing. */
export function computeMix(input: {
  weather: Weather;
  timeOfDay: TimeOfDay;
  layerVolumes: Record<string, number>;
  masterVolume: number;
  playing: boolean;
}): Record<string, number> {
  const levels = layerLevels(input.weather, input.timeOfDay, input.layerVolumes);
  const mix: Record<string, number> = {};
  for (const id of LAYER_ORDER) {
    mix[id] = input.playing ? levels[id] * input.masterVolume : 0;
  }
  return mix;
}

/** Remove your saved slider values for one weather (back to its defaults). */
export function resetWeatherMix(
  layerVolumes: Record<string, number>,
  weather: Weather,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(layerVolumes).filter(([key]) => !key.startsWith(`${weather}:`)),
  );
}
