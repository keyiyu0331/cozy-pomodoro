import { describe, expect, it } from 'vitest';
import { WEATHER_ORDER } from '../scene/themeConfig';
import { computeMix, layerLevels, mixKey, resetWeatherMix, shouldPlayAmbient } from './mix';
import { LAYER_ORDER, SOUND_LAYERS, WEATHER_SOUNDS } from './soundConfig';

describe('soundConfig', () => {
  it('every layer in the mixer order is defined, and vice versa', () => {
    expect([...LAYER_ORDER].sort()).toEqual(Object.keys(SOUND_LAYERS).sort());
  });

  it('every weather has sounds, and only uses layers that exist', () => {
    for (const weather of WEATHER_ORDER) {
      const { day, night } = WEATHER_SOUNDS[weather];
      expect(Object.keys(day).length).toBeGreaterThan(0);
      for (const id of [...Object.keys(day), ...Object.keys(night ?? {})]) {
        expect(SOUND_LAYERS[id], `${weather} → ${id}`).toBeDefined();
      }
    }
  });
});

describe('layerLevels', () => {
  it('uses the weather defaults, and silence for everything else', () => {
    const levels = layerLevels('rain', 'afternoon', {});
    expect(levels.rain).toBe(0.7);
    expect(levels.fire).toBe(0);
    expect(Object.keys(levels)).toEqual(LAYER_ORDER);
  });

  it('swaps birds for crickets on a clear night', () => {
    expect(layerLevels('clear', 'afternoon', {})).toMatchObject({ birds: 0.6, crickets: 0 });
    expect(layerLevels('clear', 'night', {})).toMatchObject({ birds: 0, crickets: 0.5 });
  });

  it('lets a saved slider override the default, for that weather only', () => {
    const saved = { [mixKey('rain', 'fire')]: 0.4, [mixKey('rain', 'rain')]: 0 };
    expect(layerLevels('rain', 'afternoon', saved)).toMatchObject({ fire: 0.4, rain: 0 });
    expect(layerLevels('snow', 'afternoon', saved).fire).toBe(1); // snow's own default
    expect(layerLevels('clear', 'afternoon', saved).fire).toBe(0);
  });
});

describe('shouldPlayAmbient', () => {
  it('"always" plays whatever the timer is doing', () => {
    expect(shouldPlayAmbient('always', false, 'shortBreak', 'idle')).toBe(true);
  });

  it('"focusOnly" plays only while a focus session is running', () => {
    expect(shouldPlayAmbient('focusOnly', false, 'focus', 'running')).toBe(true);
    expect(shouldPlayAmbient('focusOnly', false, 'focus', 'paused')).toBe(false);
    expect(shouldPlayAmbient('focusOnly', false, 'focus', 'idle')).toBe(false);
    expect(shouldPlayAmbient('focusOnly', false, 'shortBreak', 'running')).toBe(false);
  });

  it('"off" and mute always win', () => {
    expect(shouldPlayAmbient('off', false, 'focus', 'running')).toBe(false);
    expect(shouldPlayAmbient('always', true, 'focus', 'running')).toBe(false);
  });
});

describe('computeMix', () => {
  const base = { weather: 'rain', timeOfDay: 'afternoon', layerVolumes: {}, masterVolume: 0.5 } as const;

  it('multiplies each layer by the master volume', () => {
    const mix = computeMix({ ...base, playing: true });
    expect(mix.rain).toBeCloseTo(0.35);
    expect(mix.birds).toBe(0);
  });

  it('is silent when not playing', () => {
    const mix = computeMix({ ...base, playing: false });
    expect(Object.values(mix).every((v) => v === 0)).toBe(true);
  });
});

describe('resetWeatherMix', () => {
  it('removes only that weather’s saved sliders', () => {
    const saved = { 'rain:fire': 0.4, 'rain:rain': 0.2, 'snow:fire': 0.9 };
    expect(resetWeatherMix(saved, 'rain')).toEqual({ 'snow:fire': 0.9 });
  });
});
