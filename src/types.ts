// Shared data shapes for the whole app (from SPEC §5).
// Types only — no logic lives here.

export type Phase = 'focus' | 'shortBreak' | 'longBreak';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'clear' | 'rain' | 'storm' | 'snow' | 'windy' | 'fog';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface Settings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longBreakEvery: number;
  autoStart: boolean;
  notifications: boolean;
  chime: string;
  chimeVolume: number; // 0..1
  // The fields below are not used until later phases, but are stored from the
  // start so saved settings never need to change shape.
  ambientMode: 'always' | 'focusOnly' | 'off';
  layerVolumes: Record<string, number>;
  masterVolume: number;
  theme: { season: Season; weather: Weather; timeOfDay: TimeOfDay | 'auto' };
  surpriseWeather: boolean;
  reducedMotion: boolean;
  reviewTime?: string; // "21:00"
  /** Delete sessions older than this many days (today = day 1). 0 = keep forever. */
  keepHistoryDays: number;
}

/** The scene a session was done in (time of day already resolved from 'auto'). */
export interface ThemeSnapshot {
  season: Season;
  weather: Weather;
  timeOfDay: TimeOfDay;
}

/** One finished (or abandoned) focus session, as saved in history. */
export interface SessionRecord {
  id: string; // uuid
  startedAt: number; // epoch ms
  endedAt: number;
  plannedMinutes: number;
  actualMinutes: number; // time actually focused, pauses excluded
  completed: boolean; // false if reset/skipped early
  intention?: string;
  tagId?: string;
  rating?: 1 | 2 | 3;
  note?: string;
  theme: ThemeSnapshot;
}

/** A focus session that is in progress: what we know before it ends. */
export interface ActiveSession {
  startedAt: number;
  plannedMinutes: number;
  intention?: string;
  tagId?: string;
  theme: ThemeSnapshot;
}

export interface Tag {
  id: string;
  name: string;
  color: string; // CSS colour, e.g. "#4d8a4a"
}

export interface DailyReview {
  date: string; // YYYY-MM-DD
  wentWell?: string;
  improve?: string;
}

export const PHASE_LABELS: Record<Phase, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
};
