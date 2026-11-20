// The /wind-lab debug page: a test bench for the tree wind effects, apart
// from the real scene. It shows one tree at ×10 and a row of three at ×5,
// with controls to change the wind, slow things down, pause and step.
//
// The page keeps its OWN clock (`time`), which only moves while not paused
// or when you press Step. Every effect is worked out from that clock, so a
// paused picture is completely still and Step always shows the next pose.
//
// Nothing here reads or writes saved data.

import { useEffect, useRef, useState } from 'react';
import type { Ctx } from '../scene/draw';
import { SEASON_ORDER, SEASONS, TREE_LOOKS, WEATHER_ORDER, WEATHERS } from '../scene/themeConfig';
import { drawWindTrees, treePoseAt, type WindTree, type WindTreesOptions } from '../scene/tree/drawWindTrees';
import { POSE_NAMES, buildTreePose, CELL, treeShape, type PoseName } from '../scene/tree/treePose';
import { renderPose } from '../scene/tree/treeSprite';
import { createWind, rustleFps, windForWeather } from '../scene/wind';
import type { Season, Weather } from '../types';
import styles from './WindLab.module.css';

// The two test pictures, in scene pixels.
const BIG = { width: 60, height: 54, scale: 10, trees: [{ x: 30, baseY: 48, seed: 2, size: 3 }] };
const ROW = {
  width: 150,
  height: 54,
  scale: 5,
  trees: [
    { x: 28, baseY: 48, seed: 1, size: 2 },
    { x: 76, baseY: 48, seed: 2, size: 3 },
    { x: 122, baseY: 48, seed: 3, size: 2 },
  ],
};
const POSE_LABEL = ['REST', 'A', 'B'];

interface Settings {
  season: Season;
  /** undefined = automatic (6, or 8 in a storm) */
  fps: number | undefined;
  paused: boolean;
  /** false for weathers where the trees stand still (Clear, Rain, Fog) */
  rustle: boolean;
  reducedMotion: boolean;
}

function paint(ctx: Ctx, view: { width: number; height: number; trees: WindTree[] }, options: WindTreesOptions) {
  ctx.fillStyle = SEASONS[options.season].ground;
  ctx.fillRect(0, 0, view.width, view.height);
  drawWindTrees(ctx, view.trees, options);
}

export default function WindLab() {
  const [weather, setWeather] = useState<Weather>('windy');
  const [season, setSeason] = useState<Season>('summer');
  const [target, setTarget] = useState(windForWeather('windy'));
  const [autoFps, setAutoFps] = useState(true);
  const [manualFps, setManualFps] = useState(6);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showPoses, setShowPoses] = useState(false);
  const [readout, setReadout] = useState({ time: 0, strength: 0, fps: 6, poses: [0, 0, 0] });

  const bigCanvas = useRef<HTMLCanvasElement>(null);
  const rowCanvas = useRef<HTMLCanvasElement>(null);
  const wind = useRef(createWind(windForWeather('windy')));
  const time = useRef(0);

  // The draw loop reads the latest settings from here without restarting.
  const rustle = WEATHERS[weather].treesRustle;
  const settings = useRef<Settings>({ season, fps: undefined, paused, rustle, reducedMotion });
  settings.current = { season, fps: autoFps ? undefined : manualFps, paused, rustle, reducedMotion };
  wind.current.setTarget(target);

  /** Draw both pictures for the current clock, and refresh the read-out. */
  function draw() {
    const now = settings.current;
    const options: WindTreesOptions = {
      season: now.season,
      t: time.current,
      wind: wind.current,
      fps: now.fps,
      rustle: now.rustle,
      reducedMotion: now.reducedMotion,
      area: { x: 0, y: 0, width: BIG.width, height: BIG.height },
    };
    const big = bigCanvas.current?.getContext('2d');
    const row = rowCanvas.current?.getContext('2d');
    if (big) paint(big, BIG, options);
    const rowOptions = { ...options, area: { x: 0, y: 0, width: ROW.width, height: ROW.height } };
    if (row) paint(row, ROW, rowOptions);
    setReadout({
      time: time.current,
      strength: wind.current.strength,
      fps: now.fps ?? rustleFps(wind.current.strength),
      poses: ROW.trees.map((tree) => treePoseAt(tree, rowOptions)),
    });
  }

  /** Move the lab's clock (and the easing wind) forward. */
  function advance(seconds: number) {
    time.current += seconds;
    wind.current.update(seconds);
  }

  // Run continuously; while paused the clock stands still but we keep drawing,
  // so changing a control still updates the picture.
  useEffect(() => {
    let frameId = 0;
    let last = performance.now();
    const frame = (now: number) => {
      frameId = requestAnimationFrame(frame);
      const elapsed = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!settings.current.paused) advance(elapsed);
      draw();
    };
    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, []);

  /** Step = move on by exactly one pose-length. */
  function stepOneFrame() {
    setPaused(true);
    advance(1 / (settings.current.fps ?? rustleFps(wind.current.strength)));
    draw();
  }

  function chooseWeather(next: Weather) {
    setWeather(next);
    setTarget(windForWeather(next));
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Wind lab</h1>
      <p className={styles.intro}>
        Test bench for the tree wind effects. Not part of the app; nothing here is saved.{' '}
        <a href="./">Back to the app</a>
      </p>

      <div className={styles.controls}>
        <label>
          Weather
          <select value={weather} onChange={(e) => chooseWeather(e.target.value as Weather)}>
            {WEATHER_ORDER.map((id) => (
              <option key={id} value={id}>
                {WEATHERS[id].label} (wind {WEATHERS[id].wind}{WEATHERS[id].treesRustle ? '' : ', trees still'})
              </option>
            ))}
          </select>
        </label>

        <label>
          Season
          <select value={season} onChange={(e) => setSeason(e.target.value as Season)}>
            {SEASON_ORDER.map((id) => (
              <option key={id} value={id}>
                {SEASONS[id].label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Wind strength: {target.toFixed(2)}
          <input
            type="range" min={0} max={1} step={0.05}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
          />
        </label>

        <label>
          Rustle fps: {autoFps ? 'auto' : manualFps}
          <input
            type="range" min={1} max={12} step={1}
            value={manualFps}
            disabled={autoFps}
            onChange={(e) => setManualFps(Number(e.target.value))}
          />
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={autoFps} onChange={(e) => setAutoFps(e.target.checked)} />
          Auto fps
        </label>

        <button onClick={() => setPaused(!paused)}>{paused ? 'Play' : 'Pause'}</button>
        <button onClick={stepOneFrame}>Step one frame</button>

        <label className={styles.check}>
          <input type="checkbox" checked={showPoses} onChange={(e) => setShowPoses(e.target.checked)} />
          Show poses
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} />
          Reduced motion
        </label>
      </div>

      <p className={styles.readout} aria-live="off">
        time {readout.time.toFixed(2)} s · wind now {readout.strength.toFixed(2)} (easing to {target.toFixed(2)}) ·{' '}
        {readout.fps} fps · poses: {readout.poses.map((pose) => POSE_LABEL[pose]).join(' / ')}
        {paused ? ' · PAUSED' : ''}
      </p>

      <h2 className={styles.heading}>One tree, ×{BIG.scale}</h2>
      <canvas
        ref={bigCanvas}
        className={styles.canvas}
        width={BIG.width}
        height={BIG.height}
        style={{ width: BIG.width * BIG.scale, height: BIG.height * BIG.scale }}
      />

      <h2 className={styles.heading}>Three trees, ×{ROW.scale} (should rustle out of step)</h2>
      <canvas
        ref={rowCanvas}
        className={styles.canvas}
        width={ROW.width}
        height={ROW.height}
        style={{ width: ROW.width * ROW.scale, height: ROW.height * ROW.scale }}
      />

      {showPoses && <PoseSheet season={season} seed={BIG.trees[0].seed} size={BIG.trees[0].size} />}
    </main>
  );
}

/** The three poses side by side, plus pictures of exactly which pixels differ from REST. */
function PoseSheet({ season, seed, size }: { season: Season; seed: number; size: number }) {
  const look = TREE_LOOKS[season];
  const poses = POSE_NAMES.map((name) => buildTreePose(name, seed, size, look.blossom !== null));
  const [rest, a, b] = poses;

  const countChanged = (pose: typeof rest) => pose.cells.filter((cell, i) => cell !== rest.cells[i]).length;
  const fixedChanged = [a, b].reduce(
    (count, pose) =>
      count +
      pose.cells.filter((cell, i) => {
        const isFixed = (c: number) => c >= CELL.SHADOW && c <= CELL.TRUNK_LIGHT;
        return cell !== rest.cells[i] && (isFixed(cell) || isFixed(rest.cells[i]));
      }).length,
    0,
  );

  return (
    <section>
      <h2 className={styles.heading}>Poses, ×{POSE_SCALE}</h2>
      <div className={styles.poses}>
        {POSE_NAMES.map((name, i) => (
          <PosePicture key={name} season={season} seed={seed} size={size} pose={name} label={POSE_LABEL[i]} />
        ))}
        <PosePicture season={season} seed={seed} size={size} pose="a" diff label={`A vs REST: ${countChanged(a)} px`} />
        <PosePicture season={season} seed={seed} size={size} pose="b" diff label={`B vs REST: ${countChanged(b)} px`} />
      </div>
      <p className={styles.readout}>
        Pink = pixels that differ from REST. Trunk and shadow pixels changed: {fixedChanged}.
      </p>
    </section>
  );
}

const POSE_SCALE = 8;

function PosePicture(props: {
  season: Season;
  seed: number;
  size: number;
  pose: PoseName;
  label: string;
  diff?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const shape = treeShape(props.size);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const look = TREE_LOOKS[props.season];
    const blossoms = look.blossom !== null;
    const pose = buildTreePose(props.pose, props.seed, props.size, blossoms);
    ctx.fillStyle = SEASONS[props.season].ground;
    ctx.fillRect(0, 0, pose.width, pose.height);

    if (!props.diff) {
      ctx.drawImage(renderPose(pose, look), 0, 0);
      return;
    }
    // Diff view: REST faded out, with every differing pixel in pink.
    const rest = buildTreePose('rest', props.seed, props.size, blossoms);
    ctx.globalAlpha = 0.3;
    ctx.drawImage(renderPose(rest, look), 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ff00c8';
    pose.cells.forEach((cell, i) => {
      if (cell !== rest.cells[i]) ctx.fillRect(i % pose.width, Math.floor(i / pose.width), 1, 1);
    });
  }, [props.season, props.seed, props.size, props.pose, props.diff]);

  return (
    <figure className={styles.pose}>
      <canvas
        ref={canvas}
        className={styles.canvas}
        width={shape.width}
        height={shape.height}
        style={{ width: shape.width * POSE_SCALE, height: shape.height * POSE_SCALE }}
      />
      <figcaption>{props.label}</figcaption>
    </figure>
  );
}
