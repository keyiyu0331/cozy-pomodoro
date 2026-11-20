// Where every part of the house sits, and its colours. Data only — the
// drawing is in the files next to this one.
//
// The house is a two-storey Japanese shop house (machiya style):
//   main tiled roof  →  plaster-and-timber upper floor  →  small tiled eave
//   →  wooden shopfront with a noren curtain over a sliding door.

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

export const COLORS = {
  // Roof tiles, dark to light.
  tile: ['#22365a', '#2f4a78', '#3e6196', '#5580b4', '#7ba3cf'],
  snow: '#ffffff',
  snowShade: '#d6e4f0',
  // Dark timber frame, and the warmer planks of the shopfront.
  timber: '#3f2619',
  timberLight: '#5d3a26',
  plank: ['#5f3a26', '#7c4d31', '#96633e', '#b07d4f'],
  plaster: '#efe4cb',
  plasterShade: '#d8c9a8',
  plasterDeep: '#bfae8c',
  stone: ['#5f5d5c', '#7f7c79', '#a09c96', '#bdb8af'],
  glass: '#1c2a42',
  glassShine: '#3b5578',
  glow: '#ffd76a',
  glowDeep: '#f5a83a',
  paper: '#f3ead4',
  noren: '#c8502d',
  norenShade: '#9e3a20',
  norenMark: '#f6e7c4',
  lantern: '#d5432c',
  lanternShine: '#f0795a',
  lanternLit: '#ffb648',
  metal: ['#5d666e', '#8a949c', '#b6bfc6'],
};
