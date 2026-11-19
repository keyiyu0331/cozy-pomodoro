// The render loop: repaints the canvas over and over, and cross-fades when
// the scene changes. Plain TypeScript (no React) — Scene.tsx creates one of
// these and tells it what to show.
//
// Cross-fade: when the scene changes we take a "photo" of what is on screen,
// then for one second draw that photo with the new scene on top of it,
// getting gradually more solid.

import { SCENE_H, SCENE_W, type Ctx } from './draw';
import { drawScene } from './drawScene';
import type { SceneState } from './themeConfig';
import { createWind, windForWeather } from './wind';

const FADE_MS = 1000;
const FRAME_MS = 66; // ~15 frames a second is plenty for pixel art, and saves battery

export interface Renderer {
  /** Show this scene, cross-fading from whatever is showing now. */
  setState: (next: SceneState) => void;
  /** false = freeze the idle animations (reduced motion). */
  setAnimated: (animated: boolean) => void;
  stop: () => void;
}

function makeBuffer(): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement('canvas');
  canvas.width = SCENE_W;
  canvas.height = SCENE_H;
  return { canvas, ctx: canvas.getContext('2d')! };
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  canvas.width = SCENE_W;
  canvas.height = SCENE_H;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const photo = makeBuffer(); // the old scene, frozen, during a fade
  const incoming = makeBuffer(); // the new scene, drawn fresh each frame of a fade

  let state: SceneState | null = null;
  // The wind eases toward each new weather's strength instead of jumping.
  let wind: ReturnType<typeof createWind> | null = null;
  let lastFrame = 0;
  let animated = true;
  let fadeStart: number | null = null;
  let needsDraw = true;
  let lastDraw = 0;
  let frameId = 0;

  function frame(now: number): void {
    frameId = requestAnimationFrame(frame);
    const sinceLastFrame = lastFrame ? Math.min(0.5, (now - lastFrame) / 1000) : 0;
    lastFrame = now;
    wind?.update(sinceLastFrame);
    if (!state || !wind) return;

    const fading = fadeStart !== null;
    const due = animated && now - lastDraw >= FRAME_MS;
    if (!fading && !needsDraw && !due) return; // nothing new to show yet

    lastDraw = now;
    needsDraw = false;
    const t = animated ? now / 1000 : 0;

    if (fadeStart === null) {
      drawScene(ctx, state, t, animated, wind);
      return;
    }
    const progress = Math.min(1, (now - fadeStart) / FADE_MS);
    drawScene(incoming.ctx, state, t, animated, wind);
    ctx.globalAlpha = 1;
    ctx.drawImage(photo.canvas, 0, 0);
    ctx.globalAlpha = progress;
    ctx.drawImage(incoming.canvas, 0, 0);
    ctx.globalAlpha = 1;
    if (progress >= 1) fadeStart = null;
  }

  frameId = requestAnimationFrame(frame);

  return {
    setState(next) {
      const same =
        state &&
        state.season === next.season &&
        state.weather === next.weather &&
        state.timeOfDay === next.timeOfDay;
      if (same) return;
      if (wind) wind.setTarget(windForWeather(next.weather));
      else wind = createWind(windForWeather(next.weather)); // first scene: no easing needed
      if (state) {
        photo.ctx.drawImage(canvas, 0, 0); // works mid-fade too: we photograph the blend
        fadeStart = performance.now();
      }
      state = next;
      needsDraw = true;
    },
    setAnimated(value) {
      animated = value;
      needsDraw = true;
    },
    stop() {
      cancelAnimationFrame(frameId);
    },
  };
}
