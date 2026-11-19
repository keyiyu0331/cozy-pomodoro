import { describe, expect, it } from 'vitest';
import type { Ctx } from './draw';
import { WEATHER_ORDER } from './themeConfig';
import { POSE_A, POSE_B, REST, rustlePose } from './tree/rustle';
import { CELL, TREE_W, buildTreePose } from './tree/treePose';
import { drawLooseLeaves } from './weather/looseLeaves';
import { drawStreaks } from './weather/streaks';
import {
  createWind,
  easeToward,
  leavesPerSecond,
  rustleFps,
  streaksPerSecond,
  windForWeather,
  type Wind,
} from './wind';

/** A stand-in canvas context that counts fillRect calls and checks they are whole pixels. */
function fakeContext(): { ctx: Ctx; rects: () => number } {
  let count = 0;
  const target: Record<string, unknown> = {
    fillRect: (x: number, y: number, w: number, h: number) => {
      if (![x, y, w, h].every(Number.isInteger)) throw new Error(`not whole pixels: ${x},${y},${w},${h}`);
      count++;
    },
  };
  const ctx = new Proxy(target, {
    get: (obj, key: string) => obj[key] ?? (() => {}),
    set: () => true,
  }) as unknown as Ctx;
  return { ctx, rects: () => count };
}

const blowing = (strength: number): Wind => ({ strength, direction: 1 });

describe('wind', () => {
  it('gives every weather a strength from 0 to 1, with fog calm and storm strongest', () => {
    for (const weather of WEATHER_ORDER) {
      expect(windForWeather(weather)).toBeGreaterThanOrEqual(0);
      expect(windForWeather(weather)).toBeLessThanOrEqual(1);
    }
    expect(windForWeather('fog')).toBe(0);
    expect(windForWeather('clear')).toBeLessThan(windForWeather('windy'));
    expect(windForWeather('windy')).toBeLessThan(windForWeather('storm'));
  });

  it('eases to a new strength over about 2 seconds without overshooting', () => {
    const wind = createWind(0);
    wind.setTarget(1);
    let previous = 0;
    for (let frame = 0; frame < 60; frame++) {
      wind.update(1 / 60);
      expect(wind.strength).toBeGreaterThanOrEqual(previous);
      expect(wind.strength).toBeLessThanOrEqual(1);
      previous = wind.strength;
    }
    expect(wind.strength).toBeGreaterThan(0.6); // 1 s in: well on the way
    expect(wind.strength).toBeLessThan(0.99); // ...but not there yet
    for (let frame = 0; frame < 60; frame++) wind.update(1 / 60);
    expect(wind.strength).toBeGreaterThan(0.94); // 2 s in: all but arrived
    expect(easeToward(0.5, 0.5, 1)).toBe(0.5);
  });

  it('turns strength into rates that match the spec', () => {
    expect(streaksPerSecond(0)).toBe(0); // fog: none
    expect(streaksPerSecond(windForWeather('clear'))).toBeGreaterThan(0.3); // ~1 every 2–3 s
    expect(streaksPerSecond(windForWeather('clear'))).toBeLessThan(0.55);
    expect(streaksPerSecond(windForWeather('windy'))).toBeGreaterThan(2); // 2–3 per second
    expect(streaksPerSecond(windForWeather('windy'))).toBeLessThan(3.2);
    expect(streaksPerSecond(1)).toBeGreaterThan(streaksPerSecond(windForWeather('windy')));
    expect(leavesPerSecond(0)).toBe(0);
    expect(leavesPerSecond(windForWeather('clear'))).toBeLessThan(0.1); // rare
    expect(leavesPerSecond(windForWeather('windy'))).toBeGreaterThan(1); // frequent
    expect([rustleFps(0.7), rustleFps(1)]).toEqual([6, 8]);
  });
});

describe('tree poses', () => {
  const seed = 7;
  const rest = buildTreePose('rest', seed);
  const a = buildTreePose('a', seed);
  const b = buildTreePose('b', seed);
  const fixed = (cell: number) => cell >= CELL.SHADOW && cell <= CELL.TRUNK_LIGHT; // shadow or trunk
  const changed = (pose: typeof rest) => [...rest.cells.keys()].filter((i) => rest.cells[i] !== pose.cells[i]);

  it('is repeatable, and different seeds give different trees', () => {
    expect(buildTreePose('rest', seed).cells).toEqual(rest.cells);
    expect(buildTreePose('rest', seed + 1).cells).not.toEqual(rest.cells);
  });

  it('has a canopy about 50–60 pixels wide', () => {
    const columns = new Set<number>();
    rest.cells.forEach((cell, i) => {
      if (cell >= CELL.OUTLINE) columns.add(i % TREE_W);
    });
    expect(columns.size).toBeGreaterThanOrEqual(48);
    expect(columns.size).toBeLessThanOrEqual(60);
  });

  it('never changes a trunk or shadow pixel between poses', () => {
    for (const pose of [a, b]) {
      rest.cells.forEach((cell, i) => {
        if (fixed(cell) || fixed(pose.cells[i])) expect(pose.cells[i]).toBe(cell);
      });
    }
  });

  it('changes only a small scattering of canopy pixels, different for A and B', () => {
    const canopyPixels = rest.cells.filter((cell) => cell >= CELL.OUTLINE).length;
    for (const pose of [a, b]) {
      const count = changed(pose).length;
      expect(count).toBeGreaterThan(10);
      expect(count).toBeLessThan(canopyPixels * 0.15);
    }
    expect(changed(a)).not.toEqual(changed(b));
  });

  it('moves the outline by at most 1 pixel', () => {
    const isCanopy = (pose: typeof rest, i: number) => pose.cells[i] >= CELL.OUTLINE;
    for (const pose of [a, b]) {
      rest.cells.forEach((_, i) => {
        if (isCanopy(rest, i) === isCanopy(pose, i)) return; // silhouette unchanged here
        // A pixel that joined or left the canopy must touch the REST outline.
        const x = i % TREE_W;
        const y = Math.floor(i / TREE_W);
        let touchesRim = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (rest.cells[(y + dy) * TREE_W + x + dx] === CELL.OUTLINE) touchesRim = true;
          }
        }
        expect(touchesRim).toBe(true);
      });
    }
  });
});

describe('rustlePose', () => {
  /** The poses seen over a stretch of time, with repeats collapsed. */
  function posesSeen(strength: number, seconds: number, fps?: number): number[] {
    const seen: number[] = [];
    for (let t = 0; t < seconds; t += 0.01) {
      const pose = rustlePose(t, strength, 3, fps);
      if (seen[seen.length - 1] !== pose) seen.push(pose);
    }
    return seen;
  }

  it('always rests in dead calm', () => {
    expect(posesSeen(0, 30)).toEqual([REST]);
  });

  it('cycles REST, A, REST, B without pause when windy', () => {
    const seen = posesSeen(0.7, 4);
    expect(seen.length).toBeGreaterThan(20); // ~6 per second
    const start = seen.indexOf(POSE_A);
    expect(seen.slice(start, start + 8)).toEqual([POSE_A, REST, POSE_B, REST, POSE_A, REST, POSE_B, REST]);
  });

  it('holds each pose for one step of the chosen fps', () => {
    expect(posesSeen(1, 2).length).toBeGreaterThan(posesSeen(0.7, 2).length); // storm: 8 fps vs 6
    expect(posesSeen(0.7, 2, 3).length).toBeLessThan(posesSeen(0.7, 2, 12).length);
  });

  it('in light wind mostly rests, with short A-then-B bursts every few seconds', () => {
    let resting = 0;
    const samples = 6000;
    for (let i = 0; i < samples; i++) if (rustlePose(i * 0.01, 0.15, 3) === REST) resting++;
    expect(resting / samples).toBeGreaterThan(0.8);

    const bursts = posesSeen(0.15, 60).join('').split(String(POSE_A)).length - 1;
    expect(bursts).toBeGreaterThanOrEqual(15); // 60 s / 4 s
    expect(bursts).toBeLessThanOrEqual(30); // 60 s / 2 s
    expect(posesSeen(0.15, 60).join('')).toMatch(/^0?(1020)+1?0?2?0?$/); // always A, REST, B, REST
  });

  it('gives different trees different timing', () => {
    const offsets = new Set([1, 2, 3].map((seed) => posesSeen(0.15, 20).join('') + rustlePose(0.5, 0.7, seed)));
    const firstBurst = (seed: number) => {
      for (let t = 0; t < 20; t += 0.01) if (rustlePose(t, 0.15, seed) !== REST) return t;
      return -1;
    };
    expect(new Set([firstBurst(1), firstBurst(2), firstBurst(3)]).size).toBe(3);
    expect(offsets.size).toBeGreaterThan(0);
  });
});

describe('streaks and loose leaves', () => {
  const area = { x: 0, y: 0, width: 96, height: 88 };
  const canopy = { x: 48, y: 40, radius: 24 };

  function totalRects(draw: (ctx: Ctx, t: number) => void): number {
    const { ctx, rects } = fakeContext();
    for (let t = 0; t < 20; t += 0.05) draw(ctx, t);
    return rects();
  }
  const streaks = (strength: number) => totalRects((ctx, t) => drawStreaks(ctx, area, t, blowing(strength)));
  const leaves = (strength: number, colors = ['#000000']) =>
    totalRects((ctx, t) => drawLooseLeaves(ctx, canopy, colors, t, blowing(strength), 1));

  it('draws nothing in dead calm', () => {
    expect(streaks(0)).toBe(0);
    expect(leaves(0)).toBe(0);
  });

  it('draws clearly more as the wind picks up', () => {
    expect(streaks(0.15)).toBeGreaterThan(0);
    expect(streaks(0.7)).toBeGreaterThan(streaks(0.15) * 3);
    expect(streaks(1)).toBeGreaterThan(streaks(0.7) * 1.5);
    expect(leaves(0.7)).toBeGreaterThan(leaves(0.15) * 3);
    expect(leaves(1)).toBeGreaterThan(leaves(0.7));
  });

  it('draws no leaves when the season has none (winter)', () => {
    expect(leaves(1, [])).toBe(0);
  });
});
