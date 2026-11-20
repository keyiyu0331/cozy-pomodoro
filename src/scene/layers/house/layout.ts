// Where every part of the house sits, and its colours. Data only — the
// drawing is in the files next to this one.
//
// The house is a two-storey Japanese shop house (machiya style):
//   main tiled roof  →  plaster-and-timber upper floor  →  small tiled eave
//   →  wooden shopfront with a noren curtain over a sliding door.

import type { Season } from '../../../types';
import { GROUND_Y, HOUSE_X } from '../../draw';

/** Left and right edges of the ground-floor walls, and the ground line. */
export const L = HOUSE_X;
export const R = HOUSE_X + 70;
export const BASE = GROUND_Y;

// Rows (y), top to bottom.
export const ROOF_TOP = BASE - 73;
export const ROOF_ROWS = 18;
export const UPPER_TOP = ROOF_TOP + ROOF_ROWS; // upper floor walls start here
export const EAVE_TOP = BASE - 32; // the small roof between the floors
export const EAVE_ROWS = 6;
export const LOWER_TOP = EAVE_TOP + EAVE_ROWS; // ground floor walls start here

// Things with glass, shared by the day drawing and the night lights.
export const UPPER_WINDOW = { x: L + 11, y: UPPER_TOP + 6, panes: 3, paneW: 8, h: 11 };
export const ROUND_WINDOW = { x: R - 15, y: UPPER_TOP + 11, radius: 5 };
export const LATTICE_WINDOW = { x: L + 5, y: LOWER_TOP + 6, w: 12, h: 12 };
export const DOOR = { x: L + 20, y: LOWER_TOP + 3, w: 20, h: 21 };
export const SHOP_WINDOW = { x: L + 48, y: LOWER_TOP + 6, w: 18, h: 11 };
export const LANTERN = { x: R - 9, y: LOWER_TOP };
/** The stone lantern standing in the garden, right of the house. */
export const STONE_LANTERN = { x: R + 12, y: BASE + 3 };
export const PIPE = { x: R - 14, top: ROOF_TOP - 8 };

// A pastel scheme: pink roofs, cream walls, a warm wooden frame and light
// wooden planks, sky-blue glass, with orange and hot-pink accents.
export const COLORS = {
  // Roof tiles, dark to light.
  tile: ['#c9558a', '#e672a2', '#f590b8', '#fbb0cd', '#ffd3e3'],
  snow: '#ffffff',
  snowShade: '#dde8f2',
  // The frame (posts, beams, window frames), and the shopfront's planks.
  timber: '#7d4e33',
  timberLight: '#a87650',
  plank: ['#a9744d', '#c48f63', '#dbab7e', '#edc79d'],
  plaster: '#fff3e6',
  plasterShade: '#f8dcdc',
  plasterDeep: '#e9bfd6',
  stone: ['#8a8580', '#aaa49c', '#c8c2b8', '#e0dbd0'],
  glass: '#8db9f2',
  glassShine: '#dcecff',
  glow: '#ffd76a',
  glowDeep: '#f5a83a',
  paper: '#fff8ea',
  noren: '#f7a245',
  norenShade: '#e37f3c',
  norenMark: '#fff3d6',
  lantern: '#f0649a',
  lanternShine: '#ffa3c4',
  lanternLit: '#ffb648',
  metal: ['#7d858c', '#a3abb2', '#c9d0d5'],
};

/**
 * The flowering vine on the house (think wisteria), per season: five flower
 * shades from dark to light, and the colour of the few leaves showing through.
 * Winter is frosted, like the trees.
 */
export const VINE: Record<Season, { tones: string[]; leaf: string }> = {
  spring: { tones: ['#7d66bd', '#9c84d8', '#b9a4ea', '#d5c7f6', '#f1eaff'], leaf: '#8fcf86' },
  summer: { tones: ['#6f58b0', '#8f76cf', '#ad97e4', '#cbbcf3', '#e9e0ff'], leaf: '#6fb873' },
  autumn: { tones: ['#8a4f86', '#ab6aa3', '#c98bbd', '#e2afd3', '#f6d8ea'], leaf: '#d9a05a' },
  winter: { tones: ['#8f93b8', '#aeb2d2', '#cdd0e6', '#e6e8f4', '#ffffff'], leaf: '#ffffff' },
};
