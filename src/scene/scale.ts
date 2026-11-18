// Works out how big to show the 320×180 scene so it covers the whole window.
// The scale is always a whole number (2×, 3×, 4×...) so every scene pixel
// becomes a perfect square block — that is what keeps pixel art crisp.

import { SCENE_H, SCENE_W } from './draw';

export interface SceneLayout {
  scale: number;
  width: number; // on-screen size in CSS pixels
  height: number;
  left: number; // on-screen position (negative = that much is cropped off)
  top: number;
}

/**
 * Smallest whole-number scale that leaves no empty bars, centred. Whatever
 * doesn't fit hangs off the edges equally on both sides.
 */
export function coverLayout(viewW: number, viewH: number): SceneLayout {
  const scale = Math.max(1, Math.ceil(Math.max(viewW / SCENE_W, viewH / SCENE_H)));
  const width = SCENE_W * scale;
  const height = SCENE_H * scale;
  return {
    scale,
    width,
    height,
    left: Math.round((viewW - width) / 2),
    top: Math.round((viewH - height) / 2),
  };
}
