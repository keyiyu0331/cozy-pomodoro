// Paints one complete frame of the scene by running every layer in order,
// back to front. Pure drawing: give it a canvas context, which scene to show
// and the time, and it paints — it knows nothing about React or the page.

import type { Ctx, Layer } from './draw';
import { drawCottage, drawLights } from './layers/cottage';
import { drawGround } from './layers/ground';
import { drawHills } from './layers/hills';
import { drawOverlay } from './layers/overlay';
import { drawSky } from './layers/sky';
import { drawTrees } from './layers/trees';
import { getSceneTheme, type SceneState } from './themeConfig';
import { drawWeather } from './weather';

// Back to front. To add a layer, write its file and add it to this list.
const LAYERS: Layer[] = [
  drawSky,
  drawHills,
  drawTrees,
  drawCottage,
  drawGround,
  drawWeather, // rain, snow, leaves, fog...
  drawOverlay,
  drawLights, // after the overlay, so lights aren't dimmed by the night tint
];

export function drawScene(ctx: Ctx, state: SceneState, t: number, animated = true): void {
  const theme = getSceneTheme(state, animated);
  for (const layer of LAYERS) layer(ctx, theme, t);
}
