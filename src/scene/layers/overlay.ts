// Top layer: a see-through colour wash over everything, e.g. dark blue at
// night or warm orange at sunset. (Phase 4 adds fog and lightning here.)

import { SCENE_H, SCENE_W, rect, type Layer } from '../draw';

export const drawOverlay: Layer = (ctx, { sky }) => {
  if (sky.tint) rect(ctx, 0, 0, SCENE_W, SCENE_H, sky.tint);
};
