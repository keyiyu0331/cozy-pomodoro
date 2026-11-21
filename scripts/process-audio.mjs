// Turns the raw recordings in audio/ into the sound files the app plays, in
// public/assets/audio/. Needs ffmpeg. Run with:
//   npm run process-audio                 every sound
//   npm run process-audio -- rain water   only the sounds named
//
// For each looping background it:
//   1. cuts a stretch out of the recording, skipping the first seconds
//      (often handling noise);
//   2. makes it loop seamlessly, by cross-fading the end of the stretch into
//      audio from just before its start — so the last moment flows into the first;
//   3. sets every sound to the same overall loudness (the mixer does the rest);
//   4. compresses it to .m4a (AAC), which every browser plays;
//   5. checks that the loop is as loud at its two ends as in the middle, and
//      warns if not — a dip there is heard as "the clip is restarting".
//
// The raw recordings are large and are NOT stored in git; only the processed
// files are. To change a sound: replace its file in audio/, adjust the table
// below if needed, and run the script again.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';

const IN_DIR = 'audio';
const OUT_DIR = 'public/assets/audio';
const SAMPLE_RATE = 44100;
const BITRATE = '96k';
const SKIP_START = 2; // seconds ignored at the start of a recording (see skipStart below)
const SKIP_END = 2; // ...and at the end
const CROSSFADE = 4; // seconds of overlap that hide the loop point
const LOUDNESS = -20; // target loudness in LUFS (a standard measure), same for all
const CEILING = -1.5; // dB: nothing in a finished file is louder than this
const PEAK_SQUEEZE = 3; // dB of peak a limiter may round off (see encode)
const AAC_BLOCK = 1024; // the AAC encoder works in blocks of this many samples
const EDGE_SECONDS = 3; // the flatness check compares this much of each end...
const EDGE_TOLERANCE = 1.5; // ...and warns when an end is this many dB off the whole

/**
 * out = file name without extension; maxSeconds = longest loop to keep.
 * skipStart = seconds to ignore at the start, when the default is not enough.
 * The rain and water recordings fade in slowly (about 10 seconds to reach
 * full volume). Those quiet seconds must not end up in the loop, or it
 * audibly dips each time it comes round.
 */
const LOOPS = [
  { in: 'rain.mp3', out: 'rain', maxSeconds: 180, skipStart: 12 },
  { in: 'storm.mp3', out: 'storm', maxSeconds: 180 },
  { in: 'wind.wav', out: 'wind', maxSeconds: 180 },
  { in: 'bird.wav', out: 'birds', maxSeconds: 210 },
  { in: 'cricket.wav', out: 'crickets', maxSeconds: 210 },
  // A fire is all sharp crackles over a quiet hiss; let more of each crackle's
  // peak be rounded off, or the whole sound stays too quiet.
  { in: 'fire.aiff', out: 'fire', maxSeconds: 180, peakSqueeze: 9 },
  { in: 'water.flac', out: 'water', maxSeconds: 210, skipStart: 12 },
];

/** Played once at a time, not looped: trimmed, levelled and faded out. */
const ONE_SHOTS = [{ in: 'thunder.wav', out: 'thunder', maxSeconds: 20, fadeOut: 4 }];

// Names given on the command line: process only those. None = everything.
const ONLY = process.argv.slice(2);
const wanted = (name) => ONLY.length === 0 || ONLY.includes(name);

const encoders = execFileSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' });
const ENCODER = encoders.includes(' aac_at ') ? 'aac_at' : 'aac'; // Apple's encoder if present

function duration(file) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    { encoding: 'utf8' },
  );
  return Number(out.trim());
}

/** Run ffmpeg; returns what it printed (it reports on stderr). */
function ffmpeg(args) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-y', ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr.slice(-800));
  return result.stderr;
}

/** Measure the audio produced by `filter`: overall loudness (LUFS) and loudest peak (dB). */
function measure(input, filter) {
  const report = ffmpeg([
    '-i', input,
    '-filter_complex', `${filter},volumedetect,loudnorm=print_format=json[m]`,
    '-map', '[m]', '-f', 'null', '-',
  ]);
  // The loudness report is a small JSON block near the end of what ffmpeg prints.
  const json = report.slice(report.lastIndexOf('{'), report.lastIndexOf('}') + 1);
  return {
    loudness: Number(JSON.parse(json).input_i),
    peak: Number(/max_volume: (-?[\d.]+) dB/.exec(report)[1]),
  };
}

/** Average level (dB) of part of a finished file. `where` = ffmpeg options picking the part. */
function level(file, where = []) {
  const report = ffmpeg([...where, '-i', file, '-af', 'astats=measure_perchannel=none:measure_overall=RMS_level', '-f', 'null', '-']);
  return Number(/RMS level dB: (-?[\d.]+)/.exec(report)[1]);
}

/**
 * Flatness check for a finished loop: its first and last seconds should be
 * about as loud as the whole. Prints the differences, and a warning if an
 * end is noticeably off.
 */
function checkLoopEnds(outName) {
  const file = `${OUT_DIR}/${outName}.m4a`;
  const whole = level(file);
  const start = level(file, ['-t', String(EDGE_SECONDS)]) - whole;
  const end = level(file, ['-sseof', String(-EDGE_SECONDS)]) - whole;
  const show = (dB) => `${dB >= 0 ? '+' : ''}${dB.toFixed(1)} dB`;
  console.log(`      loop ends vs whole: start ${show(start)}, end ${show(end)}`);
  if (Math.abs(start) > EDGE_TOLERANCE || Math.abs(end) > EDGE_TOLERANCE) {
    console.log(`      WARNING: ${outName} is uneven at its loop point and may audibly dip or jump.`);
    console.log('      If the recording fades in or out, give it a larger skipStart in the LOOPS table.');
  }
}

/**
 * Encode the audio produced by `filter`, turned up or down by one fixed
 * amount. (One fixed amount for the whole file — an automatic leveller would
 * change the volume over time and could make the loop point audible.)
 *
 * The amount aims for the target loudness, but is held back for "spiky"
 * sounds such as a crackling fire: their peaks may be pushed at most
 * PEAK_SQUEEZE dB past the ceiling, where a limiter rounds them off. More
 * than that would audibly flatten the crackles.
 */
function encode(input, filter, outName, peakSqueeze = PEAK_SQUEEZE) {
  const { loudness, peak } = measure(input, filter);
  const gain = Math.min(LOUDNESS - loudness, CEILING + peakSqueeze - peak);
  const output = `${OUT_DIR}/${outName}.m4a`;
  ffmpeg([
    '-i', input,
    '-filter_complex', `${filter},volume=${gain.toFixed(2)}dB,alimiter=limit=${10 ** (CEILING / 20)}:level=disabled,aresample=${SAMPLE_RATE}[a]`,
    '-map', '[a]', '-ac', '2', '-c:a', ENCODER, '-b:a', BITRATE, '-movflags', '+faststart',
    output,
  ]);
  const kb = Math.round(statSync(output).size / 1024);
  const sign = gain >= 0 ? '+' : '';
  console.log(
    `  ${outName}.m4a  ${duration(output).toFixed(1)} s  ${kb} KB  ` +
      `gain ${sign}${gain.toFixed(1)} dB → about ${(loudness + gain).toFixed(0)} LUFS`,
  );
}

mkdirSync(OUT_DIR, { recursive: true });
console.log(`Processing recordings from ${IN_DIR}/ with the ${ENCODER} encoder`);

for (const loop of LOOPS) {
  if (!wanted(loop.out)) continue;
  const input = `${IN_DIR}/${loop.in}`;
  if (!existsSync(input)) {
    console.log(`  (skipped ${loop.in}: not found)`);
    continue;
  }
  const skipStart = loop.skipStart ?? SKIP_START;
  const usable = duration(input) - skipStart - SKIP_END - CROSSFADE;
  const seconds = Math.min(loop.maxSeconds, Math.floor(usable));
  // Work in samples so the result is an exact length. The loop is made a whole
  // number of the encoder's 1024-sample blocks: otherwise the encoder pads the
  // last block with a few milliseconds of near-silence, right at the loop point.
  const skip = skipStart * SAMPLE_RATE;
  const fade = CROSSFADE * SAMPLE_RATE;
  const body = Math.floor((seconds * SAMPLE_RATE) / AAC_BLOCK) * AAC_BLOCK;
  // head = the few seconds just before the body; the body's ending fades into it.
  const filter =
    `[0:a]aresample=${SAMPLE_RATE},asplit[x][y];` +
    `[x]atrim=start_sample=${skip}:end_sample=${skip + fade},asetpts=PTS-STARTPTS[head];` +
    `[y]atrim=start_sample=${skip + fade}:end_sample=${skip + fade + body},asetpts=PTS-STARTPTS[body];` +
    `[body][head]acrossfade=d=${CROSSFADE}:c1=qsin:c2=qsin`;
  encode(input, filter, loop.out, loop.peakSqueeze);
  checkLoopEnds(loop.out);
}

for (const shot of ONE_SHOTS) {
  if (!wanted(shot.out)) continue;
  const input = `${IN_DIR}/${shot.in}`;
  if (!existsSync(input)) {
    console.log(`  (skipped ${shot.in}: not found)`);
    continue;
  }
  const length = Math.min(shot.maxSeconds, duration(input));
  const filter =
    `[0:a]silenceremove=start_periods=1:start_threshold=-50dB,` + // drop silence before the sound starts
    `atrim=end=${length},afade=t=in:d=0.02,afade=t=out:st=${length - shot.fadeOut}:d=${shot.fadeOut}`;
  encode(input, filter, shot.out);
}
