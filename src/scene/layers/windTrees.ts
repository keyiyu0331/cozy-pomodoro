// The big leafy trees, with their wind effects: the canopy rustle, the wind
// streaks and the loose leaves. This layer only says WHERE the trees stand
// and passes on the scene's wind; tree/drawWindTrees.ts does the drawing.
//
// It runs after the ground layer, so the trees' soft shadows lie on the grass.

import { GROUND_Y, SCENE_H, SCENE_W, type Layer } from '../draw';
import { drawWindTrees, type WindTree } from '../tree/drawWindTrees';

/** x = centre of the trunk; seed = the tree's own shape and rustle timing; size 2 = small, 3 = large. */
const TREES: WindTree[] = [
  { x: 12, baseY: GROUND_Y + 2, seed: 1, size: 2 },
  { x: 236, baseY: GROUND_Y + 2, seed: 2, size: 3 },
  { x: 272, baseY: GROUND_Y + 2, seed: 3, size: 2 },
];

/** Streaks appear over the trees and the grass, not high in the sky. */
const STREAK_AREA = { x: 0, y: 56, width: SCENE_W, height: SCENE_H - 56 };

export const drawWindTreesLayer: Layer = (ctx, theme, t) => {
  drawWindTrees(ctx, TREES, {
    season: theme.state.season,
    t,
    wind: theme.wind,
    area: STREAK_AREA,
    rustle: theme.weather.treesRustle,
    reducedMotion: !theme.animated,
  });
};
