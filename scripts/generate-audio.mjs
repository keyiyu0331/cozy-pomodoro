// Generates the PLACEHOLDER ambient sounds as .wav files in public/assets/audio/.
// Run with:  npm run generate-audio
//
// Everything is made from maths (filtered random noise + short sine "blips"),
// so there is nothing to download and no licence to worry about. Real
// recordings can replace these files later — keep the same file names.
//
// Seamless loops: every loop is built "in a circle". Filters run twice around
// the loop so their state at the end matches the start, slow volume swells
// complete a whole number of cycles, and short events that run past the end
// wrap around to the beginning. So the last sample flows into the first.

import { mkdirSync, writeFileSync } from 'node:fs';

const SR = 22050; // samples per second
const LOOP_SECONDS = 12;
const OUT_DIR = new URL('../public/assets/audio/', import.meta.url);

// ---------- helpers ----------

/** Seeded random numbers, so the script makes identical files every run. */
function makeRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function whiteNoise(length, random) {
  return Float32Array.from({ length }, () => random() * 2 - 1);
}

/** Keep sounds below `hz`. circular = true makes it loop seamlessly. */
function lowpass(x, hz, circular = true) {
  const a = 1 - Math.exp((-2 * Math.PI * hz) / SR);
  const y = new Float32Array(x.length);
  let state = 0;
  for (let pass = 0; pass < (circular ? 2 : 1); pass++) {
    for (let i = 0; i < x.length; i++) {
      state += a * (x[i] - state);
      y[i] = state;
    }
  }
  return y;
}

/** Keep sounds above `hz`. */
function highpass(x, hz, circular = true) {
  const low = lowpass(x, hz, circular);
  return x.map((v, i) => v - low[i]);
}

/** Scale so the loudest sample is `peak`. */
function normalize(x, peak = 1) {
  let max = 0;
  for (const v of x) max = Math.max(max, Math.abs(v));
  return x.map((v) => (v / (max || 1)) * peak);
}

/** A slow volume swell: `cycles` whole waves over the loop (so it loops cleanly). */
function swell(i, length, cycles, phase = 0) {
  return Math.sin((2 * Math.PI * cycles * i) / length + phase);
}

/** Add a short sine blip (optionally sweeping pitch) into buf, wrapping at the end. */
function addBlip(buf, startSeconds, fromHz, toHz, seconds, amp) {
  const n = Math.floor(seconds * SR);
  const start = Math.floor(startSeconds * SR);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    phase += (2 * Math.PI * (fromHz + (toHz - fromHz) * p)) / SR;
    const envelope = Math.sin(Math.PI * p) ** 2; // fade in and out, no clicks
    buf[(start + i) % buf.length] += Math.sin(phase) * envelope * amp;
  }
}

/** Add a tiny burst of noise that dies away quickly (a drop / a crackle). */
function addClick(buf, startSeconds, seconds, amp, random) {
  const n = Math.floor(seconds * SR);
  const start = Math.floor(startSeconds * SR);
  for (let i = 0; i < n; i++) {
    buf[(start + i) % buf.length] += (random() * 2 - 1) * Math.exp((-5 * i) / n) * amp;
  }
}

function writeWav(name, samples) {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write('RIFF', 0);
  data.writeUInt32LE(36 + samples.length * 2, 4);
  data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); // format chunk size
  data.writeUInt16LE(1, 20); // PCM
  data.writeUInt16LE(1, 22); // mono
  data.writeUInt32LE(SR, 24);
  data.writeUInt32LE(SR * 2, 28); // bytes per second
  data.writeUInt16LE(2, 32); // bytes per sample
  data.writeUInt16LE(16, 34); // bits per sample
  data.write('data', 36);
  data.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2);
  });
  writeFileSync(new URL(name, OUT_DIR), data);
  console.log(`  ${name}  ${(data.length / 1024).toFixed(0)} KB`);
}

// ---------- the sounds ----------

const N = SR * LOOP_SECONDS;

function rain(random, { drops, lowCut, highCut, rumble }) {
  const out = highpass(lowpass(whiteNoise(N, random), highCut), lowCut).map((v) => v * 0.5);
  for (let i = 0; i < drops; i++) {
    addClick(out, random() * LOOP_SECONDS, 0.004 + random() * 0.006, 0.05 + random() * 0.2, random);
  }
  if (rumble > 0) {
    const low = normalize(lowpass(whiteNoise(N, random), 180));
    for (let i = 0; i < N; i++) out[i] = out[i] * (1 + 0.2 * swell(i, N, 3)) + low[i] * rumble;
  }
  return normalize(out, 0.6);
}

function wind(random) {
  const deep = normalize(lowpass(lowpass(whiteNoise(N, random), 600), 600));
  const airy = normalize(highpass(lowpass(whiteNoise(N, random), 1500), 500));
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const gust = 0.55 + 0.3 * swell(i, N, 2) + 0.15 * swell(i, N, 5, 1);
    const hiss = Math.max(0, 0.3 + 0.25 * swell(i, N, 3, 2));
    out[i] = deep[i] * gust + airy[i] * hiss * 0.35;
  }
  return normalize(out, 0.6);
}

function birds(random) {
  const out = lowpass(whiteNoise(N, random), 800).map((v) => v * 0.04); // faint air
  for (let phrase = 0; phrase < 18; phrase++) {
    const start = random() * LOOP_SECONDS;
    const species = Math.floor(random() * 3);
    const notes = 2 + Math.floor(random() * 5);
    const loudness = 0.12 + random() * 0.2;
    for (let k = 0; k < notes; k++) {
      const at = start + k * (0.09 + random() * 0.07);
      if (species === 0) addBlip(out, at, 2800, 3600, 0.07, loudness);
      else if (species === 1) addBlip(out, at, 4600, 3900, 0.05, loudness);
      else for (let j = 0; j < 4; j++) addBlip(out, at + j * 0.028, 5000, 5400, 0.022, loudness * 0.8);
    }
  }
  return normalize(out, 0.55);
}

function crickets(random) {
  const out = lowpass(whiteNoise(N, random), 300).map((v) => v * 0.06); // night air
  const insects = [
    { hz: 4300, every: 0.5, offset: 0, pulses: 3, amp: 0.3 },
    { hz: 4750, every: 0.75, offset: 0.2, pulses: 4, amp: 0.22 },
    { hz: 3900, every: 1.0, offset: 0.55, pulses: 2, amp: 0.14 },
  ];
  for (const c of insects) {
    for (let group = 0; group < LOOP_SECONDS / c.every; group++) {
      for (let p = 0; p < c.pulses; p++) {
        addBlip(out, group * c.every + c.offset + p * 0.03, c.hz, c.hz, 0.018, c.amp);
      }
    }
  }
  return normalize(out, 0.5);
}

function fire(random) {
  const rumble = normalize(lowpass(whiteNoise(N, random), 120));
  const flicker = normalize(lowpass(whiteNoise(N, random), 3));
  const out = highpass(whiteNoise(N, random), 3000).map((v) => v * 0.02); // soft hiss
  for (let i = 0; i < N; i++) out[i] += rumble[i] * (0.6 + 0.4 * flicker[i]) * 0.5;
  for (let i = 0; i < 520; i++) {
    addClick(out, random() * LOOP_SECONDS, 0.001 + random() * 0.005, random() ** 3 * 0.8, random);
  }
  const pops = new Float32Array(N);
  for (let i = 0; i < 26; i++) addClick(pops, random() * LOOP_SECONDS, 0.02, 0.6, random);
  const softPops = lowpass(pops, 2000);
  for (let i = 0; i < N; i++) out[i] += softPops[i];
  return normalize(out, 0.6);
}

function water(random) {
  const flow = normalize(highpass(lowpass(lowpass(whiteNoise(N, random), 1100), 1100), 150));
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const lap = 0.6 + 0.2 * swell(i, N, 3) + 0.12 * swell(i, N, 7, 1) + 0.08 * swell(i, N, 11, 2);
    out[i] = flow[i] * lap;
  }
  for (let i = 0; i < 30; i++) {
    addBlip(out, random() * LOOP_SECONDS, 350 + random() * 100, 600 + random() * 150, 0.06, 0.1);
  }
  return normalize(out, 0.5);
}

/** A single thunderclap (not a loop): a sharp crack, then a long rolling rumble. */
function thunder(random) {
  const length = SR * 6;
  const roll = normalize(lowpass(lowpass(whiteNoise(length, random), 220, false), 220, false));
  const wobble = normalize(lowpass(whiteNoise(length, random), 6, false));
  const crack = lowpass(whiteNoise(length, random), 2500, false);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / SR;
    const first = t < 0.03 ? t / 0.03 : Math.exp(-(t - 0.03) / 1.6);
    const second = t > 1.2 ? Math.exp(-(t - 1.2) / 1.2) * 0.6 : 0;
    const fadeOut = Math.min(1, (6 - t) / 0.5);
    out[i] =
      (roll[i] * (first + second) * (0.6 + 0.4 * wobble[i]) + crack[i] * Math.exp(-t / 0.12) * 0.6) *
      fadeOut;
  }
  return normalize(out, 0.8);
}

// ---------- write the files ----------

mkdirSync(OUT_DIR, { recursive: true });
console.log('Writing placeholder sounds to public/assets/audio/');
writeWav('rain.wav', rain(makeRandom(1), { drops: 1800, lowCut: 1200, highCut: 6000, rumble: 0 }));
writeWav('storm.wav', rain(makeRandom(2), { drops: 4000, lowCut: 500, highCut: 8000, rumble: 0.5 }));
writeWav('wind.wav', wind(makeRandom(3)));
writeWav('birds.wav', birds(makeRandom(4)));
writeWav('crickets.wav', crickets(makeRandom(5)));
writeWav('fire.wav', fire(makeRandom(6)));
writeWav('water.wav', water(makeRandom(7)));
writeWav('thunder.wav', thunder(makeRandom(8)));
