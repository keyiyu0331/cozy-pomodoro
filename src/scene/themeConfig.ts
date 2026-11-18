// DATA, not logic: what each season and time of day looks like.
// The layer files read colours from here; the UI reads its palette from here.
// To restyle a season, edit its entry — no drawing code needs to change.

import type { Season, TimeOfDay } from '../types';

/** Everything that depends on the season. */
export interface SeasonLook {
  label: string;
  hillFar: string;
  hillNear: string;
  ground: string;
  groundDark: string; // speckles / texture on the ground
  path: string;
  blade: string; // grass tufts
  trunk: string;
  /** Canopy colours [main, highlight, shade]. Empty = bare branches. */
  leaves: string[];
  blossom: string | null; // dots on the canopy
  /** Small dots on the ground: flowers, fallen leaves... Empty = none. */
  groundDots: string[];
  pine: string;
  roof: string;
  snow: boolean; // snow on roof, trees and hilltops
  fireflies: boolean; // shown at night
  /** CSS variables for buttons and panels, so the UI matches the season. */
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

export const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];
export const TIME_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

export const SEASONS: Record<Season, SeasonLook> = {
  spring: {
    label: 'Spring',
    hillFar: '#9cc7a0',
    hillNear: '#7fb873',
    ground: '#8fce6a',
    groundDark: '#6fb154',
    path: '#d9b98a',
    blade: '#5fa24a',
    trunk: '#7a5230',
    leaves: ['#6dbb5a', '#8fd46e', '#4f9c48'],
    blossom: '#f7b6d2',
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
    },
  },
  summer: {
    label: 'Summer',
    hillFar: '#7fb59a',
    hillNear: '#5ea85c',
    ground: '#6cc04f',
    groundDark: '#4f9e3e',
    path: '#d8b27c',
    blade: '#3f8a34',
    trunk: '#6f4a2a',
    leaves: ['#3f9a46', '#57b554', '#2f7d3c'],
    blossom: null,
    groundDots: ['#ffe27a', '#ff9d5c'],
    pine: '#2f7a4a',
    roof: '#b5533c',
    snow: false,
    fireflies: true,
    ui: {
      '--wood': '#b98a4e',
      '--wood-dark': '#5f4020',
      '--wood-light': '#d8b074',
      '--paper': '#fdf6d8',
      '--ink': '#33281a',
      '--ink-soft': '#75654c',
      '--accent': '#c2691a',
    },
  },
  autumn: {
    label: 'Autumn',
    hillFar: '#c9a56e',
    hillNear: '#c2853f',
    ground: '#c9a04a',
    groundDark: '#a87f36',
    path: '#b98c5e',
    blade: '#9a7430',
    trunk: '#6a4426',
    leaves: ['#d9642b', '#f0a030', '#b8432a'],
    blossom: null,
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
    },
  },
  winter: {
    label: 'Winter',
    hillFar: '#cfdcec',
    hillNear: '#e3ecf5',
    ground: '#f2f6fb',
    groundDark: '#d5e0ee',
    path: '#cfc8be',
    blade: '#b9c6d6',
    trunk: '#5e4a3e',
    leaves: [],
    blossom: null,
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

/** Which scene to show. (Phase 4 adds weather here.) */
export interface SceneState {
  season: Season;
  timeOfDay: TimeOfDay;
}

/** A SceneState with its looks already looked up — what the layers receive. */
export interface SceneTheme {
  state: SceneState;
  season: SeasonLook;
  sky: SkyLook;
}

export function getSceneTheme(state: SceneState): SceneTheme {
  return { state, season: SEASONS[state.season], sky: SKIES[state.timeOfDay] };
}
