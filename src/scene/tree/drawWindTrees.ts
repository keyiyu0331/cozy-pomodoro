// Draws a group of trees with all three wind effects, in the right order:
// trees first (each in its current pose), then streaks ON TOP, then loose
// leaves. The wind-lab page calls this; the scene will call the same
// function once the effect is approved.

import type { Season } from '../../types';
import type { Ctx } from '../draw';
import { TREE_LOOKS } from '../themeConfig';
import { drawLooseLeaves } from '../weather/looseLeaves';
import { drawStreaks, type Area } from '../weather/streaks';
import type { Wind } from '../wind';
import { REST, rustlePose, type PoseIndex } from './rustle';
import { treeShape } from './treePose';
import { drawTree } from './treeSprite';

export interface WindTree {
  /** Centre of the trunk. */
  x: number;
  /** The ground line the tree stands on. */
  baseY: number;
  /** Gives the tree its own shape and its own rustle timing. */
  seed: number;
  /** 2 = small, 3 = large. */
  size: number;
}

export interface WindTreesOptions {
  season: Season;
  /** Time in seconds. */
  t: number;
  wind: Wind;
  /** Where streaks may appear (normally the whole canvas). */
  area: Area;
  /** Poses per second; leave out to let the wind decide. */
  fps?: number;
  /** true = canopy stays in REST, no streaks, no leaves. */
  reducedMotion: boolean;
}

/** The pose a tree is in right now. */
export function treePoseAt(tree: WindTree, options: WindTreesOptions): PoseIndex {
  if (options.reducedMotion) return REST;
  return rustlePose(options.t, options.wind.strength, tree.seed, options.fps);
}

export function drawWindTrees(ctx: Ctx, trees: WindTree[], options: WindTreesOptions): void {
  for (const tree of trees) {
    drawTree(ctx, tree.x, tree.baseY, options.season, tree.seed, tree.size, treePoseAt(tree, options));
  }
  if (options.reducedMotion) return;

  drawStreaks(ctx, options.area, options.t, options.wind);
  for (const tree of trees) {
    const shape = treeShape(tree.size);
    const canopy = { x: tree.x, y: tree.baseY - shape.baseY + shape.canopyY, radius: shape.canopyRadius };
    drawLooseLeaves(ctx, canopy, TREE_LOOKS[options.season].looseLeaves, options.t, options.wind, tree.seed);
  }
}
