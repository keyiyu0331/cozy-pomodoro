// The end-of-phase chime. For now the sound is generated in code with the
// browser's built-in Web Audio API (a few soft sine-wave notes), so no audio
// file is needed. Phase 4 can swap this for a real sample played by Howler.

export interface ChimeDef {
  label: string;
  /** Note frequencies in Hz, played one after another. */
  notes: number[];
}

// Data, not logic: add a chime by adding an entry here.
export const CHIMES: Record<string, ChimeDef> = {
  soft: { label: 'Soft bell', notes: [659.25, 523.25] },
  rise: { label: 'Rising', notes: [523.25, 659.25, 783.99] },
  lullaby: { label: 'Lullaby', notes: [783.99, 659.25, 587.33, 523.25] },
};

let ctx: AudioContext | null = null;

/**
 * Browsers only allow sound after the user has clicked or pressed a key.
 * Call this from such a handler (we do it on Start) so later chimes can play.
 */
export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    // No audio support: the app still works, just silently.
  }
}

/** Play a chime. `volume` is 0..1. */
export function playChime(name: string, volume: number): void {
  unlockAudio();
  if (!ctx || volume <= 0) return;
  const chime = CHIMES[name] ?? CHIMES.soft;
  const gapSeconds = 0.28;
  const ringSeconds = 1.4;

  chime.notes.forEach((frequency, i) => {
    const startAt = ctx!.currentTime + i * gapSeconds;
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    // Quick fade-in then a long fade-out: sounds like a struck bell, no clicks.
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.35 * volume, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + ringSeconds);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(startAt);
    osc.stop(startAt + ringSeconds + 0.05);
  });
}
