// Small drawing helpers shared by all layers, plus the scene's dimensions.
// The scene is always drawn at 320×180 "big pixels"; the browser scales it up.

import type { SceneTheme } from './themeConfig';

export const SCENE_W = 320;
export const SCENE_H = 180;
/** y where the sky/hills stop and the ground starts. */
export const GROUND_Y = 128;

/** Left edge of the cottage walls (the path in ground.ts starts at its door). */
export const COTTAGE_X = 40;

export type Ctx = CanvasRenderingContext2D;

/**
 * A layer paints one part of the scene. `t` is time in seconds, used for
 * small animations; it is always 0 when reduced motion is on.
 */
export type Layer = (ctx: Ctx, theme: SceneTheme, t: number) => void;

/** Filled rectangle snapped to whole pixels. */
export function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Filled pixel circle, drawn as one row per line so the edge stays blocky. */
export function disc(ctx: Ctx, cx: number, cy: number, radius: number, color: string): void {
  const r = Math.round(radius);
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    ctx.fillRect(Math.round(cx) - half, Math.round(cy) + dy, half * 2 + 1, 1);
  }
}

/**
 * Repeatable "random" number 0..1 for a seed. Unlike Math.random() it gives
 * the same answer every frame, so stars and flowers stay where they are.
 */
export function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Blend two "#rrggbb" colours: amount 0 gives `a`, 1 gives `b`. */
export function mix(a: string, b: string, amount: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const blend = (i: number) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * amount);
  return `rgb(${blend(0)}, ${blend(1)}, ${blend(2)})`;
}
