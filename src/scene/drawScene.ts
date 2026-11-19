// Paints one complete frame of the scene by running every layer in order,
// back to front. Pure drawing: give it a canvas context, which scene to show
// and the time, and it paints — it knows nothing about React or the page.

import type { Ctx, Layer } from './draw';
import { drawCottage, drawLights } from './layers/cottage';
import { drawCritters } from './layers/critters';
import { drawGround } from './layers/ground';
import { drawHills } from './layers/hills';
import { drawOverlay } from './layers/overlay';
import { drawProps } from './layers/props';
import { drawSky } from './layers/sky';
import { drawTrees } from './layers/trees';
import { drawWindTreesLayer } from './layers/windTrees';
import { getSceneTheme, type SceneState } from './themeConfig';
import { drawWeather } from './weather';
import type { Wind } from './wind';

// Back to front. To add a layer, write its file and add it to this list.
const LAYERS: Layer[] = [
  drawSky,
  drawHills,
  drawTrees, // pines
  drawCottage,
  drawGround,
  drawWindTreesLayer, // leafy trees, wind streaks, loose leaves
  drawProps, // fence, flower boxes
  drawCritters, // cat, chickens, birds
  drawWeather, // rain, snow, leaves, fog...
  drawOverlay,
  drawLights, // after the overlay, so lights aren't dimmed by the night tint
];

export function drawScene(ctx: Ctx, state: SceneState, t: number, animated = true, wind?: Wind): void {
  const theme = getSceneTheme(state, animated, wind);
  for (const layer of LAYERS) layer(ctx, theme, t);
}
