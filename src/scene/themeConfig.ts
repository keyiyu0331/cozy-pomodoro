// DATA, not logic: what each season, weather and time of day looks like.
// The layer files read colours from here; the UI reads its palette from here.
// To restyle a season, edit its entry — no drawing code needs to change.

import type { Season, TimeOfDay, Weather } from '../types';
import type { Wind } from './wind';

/** Everything that depends on the season. */
export interface SeasonLook {
  label: string;
  /** The little colour square shown next to the season's name in the Almanac. */
  swatch: string;
  /** Weathers that feel right for this season (others are still allowed). */
  suggestedWeather: Weather[];
  hillFar: string;
  hillNear: string;
  ground: string;
  groundDark: string; // speckles / texture on the ground
  path: string;
  blade: string; // grass tufts
  trunk: string;
  /** Small dots on the ground: flowers, fallen leaves... Empty = none. */
  groundDots: string[];
  pine: string;
  roof: string;
  snow: boolean; // snow on roof, trees and hilltops
  fireflies: boolean; // shown at night
  /**
   * CSS variables for buttons and panels, so the UI matches the season.
   * '--accent' colours the Start button and phase label during focus; the two
   * break accents replace it during breaks.
   */
  ui: Record<string, string>;
}

/** Everything that depends on the time of day. */
export interface SkyLook {
  label: string;
  top: string; // sky colour at the top...
  bottom: string; // ...blending to this at the horizon
  orb: { x: number; y: number; radius: number; color: string; moon: boolean };
  starAmount: number; // 0 = none, 1 = all
  cloud: string;
  /** Colour wash over the whole scene (e.g. dark blue at night), or null. */
  tint: string | null;
  windowsLit: boolean;
}

/** Everything that depends on the weather. */
export interface WeatherLook {
  label: string;
  /**
   * Which particle effects to draw, by name. Each name must have an entry in
   * the PARTICLES table in scene/weather/index.ts.
   */
  particles: string[];
  /** How heavy the effect is (1 = normal). */
  intensity: number;
  /** Grey wash for cloudy weather, or null for a clear sky (sun/moon/stars show). */
  overcast: string | null;
  lightning: boolean;
  /** Are the cat, chickens and birds out in this weather? */
  critters: boolean;
  /** How windy it is: 0 = dead calm, 1 = storm. scene/wind.ts turns this into rates. */
  wind: number;
}

export const WEATHER_ORDER: Weather[] = ['clear', 'rain', 'storm', 'snow', 'windy', 'fog'];

export const WEATHERS: Record<Weather, WeatherLook> = {
  clear: { label: 'Clear', particles: [], intensity: 1, overcast: null, lightning: false, critters: true, wind: 0.15 },
  rain: { label: 'Rain', particles: ['rain'], intensity: 1, overcast: 'rgba(70, 80, 100, 0.35)', lightning: false, critters: false, wind: 0.35 },
  storm: { label: 'Storm', particles: ['rain'], intensity: 1.8, overcast: 'rgba(38, 42, 68, 0.55)', lightning: true, critters: false, wind: 1 },
  snow: { label: 'Snow', particles: ['snow'], intensity: 1, overcast: 'rgba(200, 210, 225, 0.30)', lightning: false, critters: false, wind: 0.2 },
  windy: { label: 'Windy', particles: [], intensity: 1, overcast: null, lightning: false, critters: true, wind: 0.7 },
  fog: { label: 'Fog', particles: ['fog'], intensity: 1, overcast: 'rgba(214, 218, 222, 0.28)', lightning: false, critters: true, wind: 0 },
};

/** Colours of the leafy trees for one season. */
export interface TreeLook {
  /** Canopy colours, darkest first — exactly 5. */
  tones: [string, string, string, string, string];
  /** Trunk: [shaded side, middle, lit side]. */
  trunk: [string, string, string];
  /** Blossom dots on the canopy, or null for none. */
  blossom: string | null;
  /** Colours of the leaves the wind carries off. Empty = no loose leaves. */
  looseLeaves: string[];
}

export const TREE_SHADOW = 'rgba(0, 0, 0, 0.22)';

export const TREE_LOOKS: Record<Season, TreeLook> = {
  spring: {
    tones: ['#236357', '#34865a', '#4fa856', '#7cc75a', '#bfe36a'],
    trunk: ['#5a2e22', '#8a4a34', '#a8623f'],
    blossom: '#f7b6d2',
    looseLeaves: ['#f7b6d2', '#ffd9e8'],
  },
  summer: {
    tones: ['#1f5c57', '#2c7a52', '#3f9a4c', '#62b84e', '#a6d655'],
    trunk: ['#5a2e22', '#8a4a34', '#a8623f'],
    blossom: null,
    looseLeaves: ['#2c7a52', '#3f9a4c'],
  },
  autumn: {
    tones: ['#7a2f1e', '#a8432a', '#d9642b', '#f0a030', '#f7cf5a'],
    trunk: ['#4f2a20', '#7a4430', '#9a5a3a'],
    blossom: null,
    looseLeaves: ['#d9642b', '#a8432a', '#8a5a2a'],
  },
  winter: {
    tones: ['#4a6a72', '#6a8c8f', '#9ab5b5', '#cfe0e2', '#ffffff'],
    trunk: ['#4a3530', '#6a4c44', '#86655a'],
    blossom: null,
    looseLeaves: [],
  },
};

export const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];
export const TIME_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

export const SEASONS: Record<Season, SeasonLook> = {
  spring: {
    label: 'Spring',
    swatch: '#f4a6c6',
    suggestedWeather: ['clear', 'rain', 'windy', 'fog'],
    hillFar: '#9cc7a0',
    hillNear: '#7fb873',
    ground: '#8fce6a',
    groundDark: '#6fb154',
    path: '#d9b98a',
    blade: '#5fa24a',
    trunk: '#7a5230',
    groundDots: ['#f7b6d2', '#ffffff', '#ffe27a'],
    pine: '#3f8a55',
    roof: '#b5533c',
    snow: false,
    fireflies: false,
    ui: {
      '--wood': '#c08a52',
      '--wood-dark': '#6f4424',
      '--wood-light': '#dcae78',
      '--paper': '#fbf4de',
      '--ink': '#3a2a1b',
      '--ink-soft': '#7b6650',
      '--accent': '#c8507a',
      '--accent-short-break': '#4d8a4a',
      '--accent-long-break': '#2f6f8f',
    },
  },
  summer: {
    label: 'Summer',
    swatch: '#6cc04f',
    suggestedWeather: ['clear', 'rain', 'storm', 'windy'],
    hillFar: '#7fb59a',
    hillNear: '#5ea85c',
    ground: '#6cc04f',
    groundDark: '#4f9e3e',
    path: '#d8b27c',
    blade: '#3f8a34',
    trunk: '#6f4a2a',
    groundDots: ['#ffe27a', '#ff9d5c'],
    pine: '#2f7a4a',
    roof: '#b5533c',
    snow: false,
    fireflies: true,
    ui: {
      // Summer: a green and blue-green board with a green Start button.
      '--wood': '#5f9482',
      '--wood-dark': '#2c564d',
      '--wood-light': '#9cc4b0',
      '--paper': '#f4f7e4',
      '--ink': '#22332e',
      '--ink-soft': '#5f7a70',
      '--accent': '#2f8a48',
      // Focus is green here, so the short break is warm to stay distinct.
      '--accent-short-break': '#c2691a',
      '--accent-long-break': '#2f6f8f',
    },
  },
  autumn: {
    label: 'Autumn',
    swatch: '#c9a04a',
    suggestedWeather: ['clear', 'rain', 'storm', 'windy', 'fog'],
    hillFar: '#c9a56e',
    hillNear: '#c2853f',
    ground: '#c9a04a',
    groundDark: '#a87f36',
    path: '#b98c5e',
    blade: '#9a7430',
    trunk: '#6a4426',
    groundDots: ['#d9642b', '#f0a030', '#b8432a'],
    pine: '#4a7a4a',
    roof: '#9c4632',
    snow: false,
    fireflies: false,
    ui: {
      '--wood': '#a8683a',
      '--wood-dark': '#5a3018',
      '--wood-light': '#c98a58',
      '--paper': '#f8ecd2',
      '--ink': '#38241a',
      '--ink-soft': '#7a5f4c',
      '--accent': '#b8432a',
      '--accent-short-break': '#4d8a4a',
      '--accent-long-break': '#2f6f8f',
    },
  },
  winter: {
    label: 'Winter',
    swatch: '#f2f6fb',
    suggestedWeather: ['clear', 'snow', 'windy', 'fog'],
    hillFar: '#cfdcec',
    hillNear: '#e3ecf5',
    ground: '#f2f6fb',
    groundDark: '#d5e0ee',
    path: '#cfc8be',
    blade: '#b9c6d6',
    trunk: '#5e4a3e',
    groundDots: [],
    pine: '#3d6e5a',
    roof: '#8f4a3c',
    snow: true,
    fireflies: false,
    ui: {
      '--wood': '#8a93a8',
      '--wood-dark': '#3f4a63',
      '--wood-light': '#b4bdd0',
      '--paper': '#f4f7fb',
      '--ink': '#27304a',
      '--ink-soft': '#66708a',
      '--accent': '#3d76a6',
      '--accent-short-break': '#4d8a4a',
      '--accent-long-break': '#2f6f8f',
    },
  },
};

export const SKIES: Record<TimeOfDay, SkyLook> = {
  morning: {
    label: 'Morning',
    top: '#8fc7e8',
    bottom: '#fbe3b8',
    orb: { x: 58, y: 72, radius: 7, color: '#fff2b0', moon: false },
    starAmount: 0,
    cloud: '#ffffff',
    tint: 'rgba(255, 214, 150, 0.10)',
    windowsLit: false,
  },
  afternoon: {
    label: 'Afternoon',
    top: '#5aa9e6',
    bottom: '#bfe3f5',
    orb: { x: 176, y: 40, radius: 7, color: '#fff7c8', moon: false },
    starAmount: 0,
    cloud: '#ffffff',
    tint: null,
    windowsLit: false,
  },
  evening: {
    label: 'Evening',
    top: '#3f4a8a',
    bottom: '#f59a6b',
    orb: { x: 262, y: 88, radius: 8, color: '#ffd27a', moon: false },
    starAmount: 0.3,
    cloud: '#f7c4a8',
    tint: 'rgba(255, 110, 60, 0.16)',
    windowsLit: true,
  },
  night: {
    label: 'Night',
    top: '#0d1230',
    bottom: '#27356b',
    orb: { x: 236, y: 42, radius: 7, color: '#e9edf5', moon: true },
    starAmount: 1,
    cloud: '#3a4676',
    tint: 'rgba(16, 22, 64, 0.48)',
    windowsLit: true,
  },
};

/** Which scene to show. */
export interface SceneState {
  season: Season;
  weather: Weather;
  timeOfDay: TimeOfDay;
}

/** A SceneState with its looks already looked up — what the layers receive. */
export interface SceneTheme {
  state: SceneState;
  season: SeasonLook;
  weather: WeatherLook;
  sky: SkyLook;
  /** false when reduced motion is on: moving particles and flashes are skipped. */
  animated: boolean;
  /** How hard, and which way, the wind is blowing right now (see wind.ts). */
  wind: Wind;
}

/**
 * @param wind the current (easing) wind; left out, it is the weather's own steady strength
 */
export function getSceneTheme(state: SceneState, animated: boolean, wind?: Wind): SceneTheme {
  return {
    state,
    season: SEASONS[state.season],
    weather: WEATHERS[state.weather],
    sky: SKIES[state.timeOfDay],
    animated,
    wind: wind ?? { strength: WEATHERS[state.weather].wind, direction: 1 },
  };
}
