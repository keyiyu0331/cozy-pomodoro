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
}

export const PHASE_LABELS: Record<Phase, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
};
