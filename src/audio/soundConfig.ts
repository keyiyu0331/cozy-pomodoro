// DATA, not logic: which sound layers exist, and which ones each weather
// plays by default (and how loud, 0..1).
//
// The files are real recordings, prepared by scripts/process-audio.mjs.
// To add a sound: put the file in public/assets/audio/, add it to
// SOUND_LAYERS and LAYER_ORDER, then use it in WEATHER_SOUNDS.

import type { Weather } from '../types';

export interface SoundLayerDef {
  label: string;
  file: string; // inside public/assets/audio/
  /** true = played once now and then (thunder) instead of looping. */
  oneShot?: boolean;
}

export const SOUND_LAYERS: Record<string, SoundLayerDef> = {
  rain: { label: 'Rain', file: 'rain.m4a' },
  storm: { label: 'Heavy rain', file: 'storm.m4a' },
  thunder: { label: 'Thunder', file: 'thunder.m4a', oneShot: true },
  wind: { label: 'Wind', file: 'wind.m4a' },
  birds: { label: 'Birds', file: 'birds.m4a' },
  crickets: { label: 'Crickets', file: 'crickets.m4a' },
  fire: { label: 'Fireplace', file: 'fire.m4a' },
  water: { label: 'Water', file: 'water.m4a' },
};

/** The order the layers appear in the mixer. */
export const LAYER_ORDER = ['rain', 'storm', 'thunder', 'wind', 'birds', 'crickets', 'fire', 'water'];

/** layer id → default volume. `night` replaces `day` at night, if given. */
interface WeatherSound {
  day: Record<string, number>;
  night?: Record<string, number>;
}

export const WEATHER_SOUNDS: Record<Weather, WeatherSound> = {
  clear: { day: { birds: 0.6, wind: 0.2 }, night: { crickets: 0.5, wind: 0.15 } },
  rain: { day: { rain: 0.7 } },
  storm: { day: { storm: 0.8, thunder: 0.7 } },
  snow: { day: { wind: 0.35, fire: 1 } }, // the fire recording is quiet, so it plays at full
  windy: { day: { wind: 0.8 } },
  fog: { day: { water: 0.5 } },
};

export function soundUrl(layerId: string): string {
  return `${import.meta.env.BASE_URL}assets/audio/${SOUND_LAYERS[layerId].file}`;
}
