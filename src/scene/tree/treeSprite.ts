// Turns tree poses into pictures and hands them out. Each pose is painted
// ONCE onto a small hidden canvas and kept, so drawing a tree every frame is
// just one cheap copy.
//
// Real art: put a sprite sheet at public/assets/sprites/tree_oak.png — three
// equal frames side by side (REST, A, B), the trunk's foot at the bottom
// centre of each frame. If that file exists it is used instead of the
// generated placeholder, for every season.

import type { Season } from '../../types';
import type { Ctx } from '../draw';
import { TREE_LOOKS, TREE_SHADOW, type TreeLook } from '../themeConfig';
import type { PoseIndex } from './rustle';
import { CELL, POSE_NAMES, buildTreePose, treeShape, type TreePose } from './treePose';

export interface TreeFrames {
  /** [REST, A, B] */
  frames: CanvasImageSource[];
  width: number;
  height: number;
  /** Row inside a frame that sits on the ground. */
  baseY: number;
}

/** Which colour a cell code is painted in. */
function colorOf(cell: number, look: TreeLook): string | null {
  switch (cell) {
    case CELL.EMPTY:
      return null;
    case CELL.SHADOW:
      return TREE_SHADOW;
    case CELL.TRUNK_DARK:
      return look.trunk[0];
    case CELL.TRUNK:
      return look.trunk[1];
    case CELL.TRUNK_LIGHT:
      return look.trunk[2];
    case CELL.BLOSSOM:
      return look.blossom ?? look.tones[4];
    default:
      return look.tones[cell - CELL.TONE_0];
  }
}

/** Paint a pose grid onto a new hidden canvas, one pixel per cell. */
export function renderPose(pose: TreePose, look: TreeLook): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = pose.width;
  canvas.height = pose.height;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < pose.height; y++) {
    for (let x = 0; x < pose.width; x++) {
      const color = colorOf(pose.cells[y * pose.width + x], look);
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

const generated = new Map<string, TreeFrames>();
let sheet: TreeFrames | null = null;
let sheetRequested = false;

/** Try (once) to load the real sprite sheet. Quietly does nothing if it isn't there. */
function requestSheet(): void {
  if (sheetRequested) return;
  sheetRequested = true;
  const image = new Image();
  image.onload = () => {
    const width = Math.floor(image.width / 3);
    const frames = [0, 1, 2].map((i) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = image.height;
      canvas.getContext('2d')!.drawImage(image, i * width, 0, width, image.height, 0, 0, width, image.height);
      return canvas;
    });
    sheet = { frames, width, height: image.height, baseY: image.height };
  };
  image.src = `${import.meta.env.BASE_URL}assets/sprites/tree_oak.png`;
}

/**
 * The three frames for a tree: the sprite sheet if present, else the generated
 * placeholder at the given size (2 = small, 3 = large).
 */
export function getTreeFrames(season: Season, seed: number, size: number): TreeFrames {
  requestSheet();
  if (sheet) return sheet;

  const key = `${season}|${seed}|${size}`;
  let frames = generated.get(key);
  if (!frames) {
    const look = TREE_LOOKS[season];
    const shape = treeShape(size);
    frames = {
      frames: POSE_NAMES.map((name) => renderPose(buildTreePose(name, seed, size, look.blossom !== null), look)),
      width: shape.width,
      height: shape.height,
      baseY: shape.baseY,
    };
    generated.set(key, frames);
  }
  return frames;
}

/** Draw one tree, centred on x and standing on baseY, in the given pose. */
export function drawTree(
  ctx: Ctx,
  x: number,
  baseY: number,
  season: Season,
  seed: number,
  size: number,
  pose: PoseIndex,
): void {
  const tree = getTreeFrames(season, seed, size);
  ctx.drawImage(tree.frames[pose], Math.round(x - tree.width / 2), Math.round(baseY - tree.baseY));
}
