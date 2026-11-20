// Plays the ambient sound. A thin wrapper around Howler.js: you hand it the
// volume each layer should have (from mix.ts) and it fades every layer to
// that volume, starting and stopping the loops as needed.
//
// Howler takes care of two awkward browser rules for us: sound files loop
// without a gap, and audio that is asked to play before the user's first
// click is held back and starts automatically on that click.

import { Howl } from 'howler';
import { STRIKE_PERIOD, strikeTime } from '../scene/weather/lightning';
import { LAYER_ORDER, SOUND_LAYERS, soundUrl } from './soundConfig';

/** Thunder is heard this long after the flash. */
const THUNDER_DELAY_SECONDS = 0.5;

const sounds = new Map<string, Howl>(); // created the first time a layer is needed
const playing = new Set<string>(); // loops we have started
const stopTimers = new Map<string, number>();

let thunderVolume = 0;
let thunderTimer: number | undefined;
let lastThunderCycle = -1;

function getSound(id: string): Howl {
  let sound = sounds.get(id);
  if (!sound) {
    const oneShot = SOUND_LAYERS[id].oneShot === true;
    sound = new Howl({ src: [soundUrl(id)], loop: !oneShot, volume: oneShot ? 1 : 0 });
    sounds.set(id, sound);
  }
  return sound;
}

function fadeLoop(id: string, target: number, fadeMs: number): void {
  if (target <= 0 && !playing.has(id)) return; // silent and staying silent
  const sound = getSound(id);
  window.clearTimeout(stopTimers.get(id));

  if (target > 0) {
    if (!playing.has(id)) {
      playing.add(id);
      sound.play();
    }
    sound.fade(sound.volume(), target, fadeMs);
  } else {
    // Fade out, then stop the loop so it isn't running silently.
    sound.fade(sound.volume(), 0, fadeMs);
    const timer = window.setTimeout(() => {
      sound.stop();
      playing.delete(id);
    }, fadeMs + 50);
    stopTimers.set(id, timer);
  }
}

/** Checks a few times a second whether lightning has just struck. */
function checkThunder(): void {
  const now = performance.now() / 1000; // the same clock the scene draws with
  const cycle = Math.floor(now / STRIKE_PERIOD);
  if (cycle === lastThunderCycle || now < strikeTime(cycle) + THUNDER_DELAY_SECONDS) return;
  lastThunderCycle = cycle;
  // There is one thunder recording; a slightly different speed and loudness
  // each time keeps the claps from sounding identical.
  const sound = getSound('thunder');
  sound.rate(0.85 + Math.random() * 0.3);
  sound.volume(thunderVolume * (0.7 + Math.random() * 0.3));
  sound.play();
}

function setThunder(volume: number): void {
  thunderVolume = volume;
  if (volume > 0 && thunderTimer === undefined) {
    getSound('thunder'); // start loading it now
    thunderTimer = window.setInterval(checkThunder, 200);
  } else if (volume <= 0 && thunderTimer !== undefined) {
    window.clearInterval(thunderTimer);
    thunderTimer = undefined;
  }
}

/**
 * Move every layer to its new volume over `fadeMs` milliseconds.
 * @param mix layer id → volume 0..1 (missing = silent)
 */
export function setMix(mix: Record<string, number>, fadeMs: number): void {
  for (const id of LAYER_ORDER) {
    const target = Math.max(0, Math.min(1, mix[id] ?? 0));
    if (SOUND_LAYERS[id].oneShot) setThunder(target);
    else fadeLoop(id, target, fadeMs);
  }
}
