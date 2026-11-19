// Builds the PLACEHOLDER tree as a grid of pixels, in three poses: REST and
// two "rustle" poses, A and B. Pure: no canvas, no colours — each cell just
// holds a code (see CELL) saying what kind of pixel it is. treeSprite.ts
// turns the grid into a picture.
//
// The canopy is a big circle plus a ring of smaller overlapping circles (the
// "bumps") — together they make a round, bumpy outline. A rustle pose is the
// SAME tree with a few rim bumps made 1 pixel bigger or smaller, and a few
// interior leaves moved by 1 pixel. Nothing else differs: the trunk, roots,
// shadow and the canopy's position are built by code that never looks at
// the pose.

import { rand } from '../draw';

export const TREE_W = 64;
export const TREE_H = 76;
/** Centre of the canopy inside the grid. */
export const CANOPY_X = 32;
export const CANOPY_Y = 30;
/** Roughly where the canopy's edge is, measured from its centre. */
export const CANOPY_RADIUS = 27;
/** The row the tree stands on (bottom of the roots). */
export const TRUNK_BASE_Y = 70;

/** What a cell can be. TONE_0 is the darkest canopy green, TONE_0 + 4 the lightest. */
export const CELL = {
  EMPTY: 0,
  SHADOW: 1,
  TRUNK_DARK: 2,
  TRUNK: 3,
  TRUNK_LIGHT: 4,
  OUTLINE: 5,
  TONE_0: 6,
  BLOSSOM: 11,
} as const;

export type PoseName = 'rest' | 'a' | 'b';
export const POSE_NAMES: PoseName[] = ['rest', 'a', 'b'];

export interface TreePose {
  width: number;
  height: number;
  /** One code per pixel, row by row: cells[y * width + x]. */
  cells: Uint8Array;
}

const CORE_RADIUS = 21;
const BUMP_COUNT = 20;
const LEAF_COUNT = 22;
const BLOSSOM_COUNT = 16;

/** A leaf cluster, drawn one tone lighter than what is under it. */
const HEART = ['.#.#.', '#####', '.###.', '..#..'];

interface Bump {
  x: number;
  y: number;
  radius: number;
  /** false for bumps at the bottom, over the trunk and shadow: those never change. */
  canRustle: boolean;
}

function makeBumps(seed: number): Bump[] {
  const bumps: Bump[] = [];
  for (let i = 0; i < BUMP_COUNT; i++) {
    const angle = (i / BUMP_COUNT) * Math.PI * 2 + (rand(seed + i) - 0.5) * 0.2;
    const distance = 17.5 + rand(seed + i + 50) * 3;
    bumps.push({
      x: CANOPY_X + Math.cos(angle) * distance,
      y: CANOPY_Y + Math.sin(angle) * distance,
      radius: 5.5 + rand(seed + i + 100) * 2,
      canRustle: Math.sin(angle) < 0.5, // y grows downwards, so sin > 0.5 is the bottom third
    });
  }
  return bumps;
}

/**
 * Which bumps change in a pose, and by how much (+1 or -1 pixel of radius).
 * Going round the rim, A takes every other bump and B takes the ones in
 * between. So a changed bump always has unchanged neighbours — the changes
 * are scattered around the rim, never one long stretch — and A and B always
 * touch different bumps (6–7 each). Whether a bump grows or shrinks is random.
 */
function bumpNudges(bumps: Bump[], pose: PoseName, seed: number): Map<number, number> {
  const nudges = new Map<number, number>();
  if (pose === 'rest') return nudges;
  const startWith = rand(seed + 300) < 0.5 ? 0 : 1; // which pose gets the even-numbered bumps
  bumps.forEach((bump, index) => {
    if (!bump.canRustle) return;
    const mine = pose === 'a' ? index % 2 === startWith : index % 2 !== startWith;
    if (mine) nudges.set(index, rand(seed + 320 + index) < 0.5 ? 1 : -1);
  });
  return nudges;
}

/** How a leaf cluster is moved in a pose: a few shift by 1 px in A, a few others in B. */
function leafShift(i: number, pose: PoseName): { dx: number; dy: number } {
  if (pose === 'a' && i % 5 === 0) return { dx: i % 2 === 0 ? 1 : -1, dy: 0 };
  if (pose === 'b' && i % 5 === 2) return { dx: 0, dy: i % 2 === 0 ? 1 : -1 };
  return { dx: 0, dy: 0 };
}

/** Lighting: 4 (lightest) at the top-left, down to 0 (darkest) at the bottom-right. */
function baseTone(x: number, y: number): number {
  const light = (-(x - CANOPY_X) * 0.55 - (y - CANOPY_Y) * 0.83) / CANOPY_RADIUS;
  return Math.max(0, Math.min(4, Math.round(2 + light * 2.4)));
}

/**
 * @param seed     different seeds give differently shaped trees
 * @param blossoms dot the canopy with blossom cells (spring)
 */
export function buildTreePose(pose: PoseName, seed: number, blossoms = false): TreePose {
  const cells = new Uint8Array(TREE_W * TREE_H);
  const at = (x: number, y: number) => y * TREE_W + x;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < TREE_W && y < TREE_H;

  // --- Shadow, trunk and roots: identical in every pose. ---
  for (let y = 0; y < TREE_H; y++) {
    for (let x = 0; x < TREE_W; x++) {
      const ex = (x - CANOPY_X + 0.5) / 22;
      const ey = (y - TRUNK_BASE_Y + 0.5) / 5;
      if (ex * ex + ey * ey <= 1) cells[at(x, y)] = CELL.SHADOW;
    }
  }
  for (let y = 44; y < TRUNK_BASE_Y; y++) {
    const half = y >= 68 ? 5 : y >= 66 ? 4 : 3; // the trunk flares out into roots at the bottom
    for (let x = CANOPY_X - half; x < CANOPY_X + half; x++) {
      const fromLeft = x - (CANOPY_X - half);
      cells[at(x, y)] = fromLeft < 2 ? CELL.TRUNK_LIGHT : fromLeft >= half * 2 - 2 ? CELL.TRUNK_DARK : CELL.TRUNK;
    }
  }
  cells[at(CANOPY_X - 6, TRUNK_BASE_Y - 1)] = CELL.TRUNK;
  cells[at(CANOPY_X + 5, TRUNK_BASE_Y - 1)] = CELL.TRUNK_DARK;

  // --- Canopy shape: the core circle plus every bump (nudged in A and B). ---
  const bumps = makeBumps(seed);
  const nudges = bumpNudges(bumps, pose, seed);
  const circles = [
    { x: CANOPY_X, y: CANOPY_Y, radius: CORE_RADIUS },
    ...bumps.map((bump, i) => ({ x: bump.x, y: bump.y, radius: bump.radius + (nudges.get(i) ?? 0) })),
  ];
  const canopy = new Uint8Array(TREE_W * TREE_H); // 1 = this pixel is canopy
  for (let y = 0; y < TREE_H; y++) {
    for (let x = 0; x < TREE_W; x++) {
      const covered = circles.some((c) => (x - c.x) ** 2 + (y - c.y) ** 2 <= c.radius ** 2);
      if (covered) {
        canopy[at(x, y)] = 1;
        cells[at(x, y)] = CELL.TONE_0 + baseTone(x, y);
      }
    }
  }

  // --- Leaf clusters: heart shapes one tone lighter, with a darker pixel beneath. ---
  for (let i = 0; i < LEAF_COUNT; i++) {
    const angle = rand(seed + 400 + i) * Math.PI * 2;
    const distance = Math.sqrt(rand(seed + 500 + i)) * 16;
    const shift = leafShift(i, pose);
    const left = Math.round(CANOPY_X + Math.cos(angle) * distance) - 2 + shift.dx;
    const top = Math.round(CANOPY_Y + Math.sin(angle) * distance) - 2 + shift.dy;
    HEART.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        const x = left + rx;
        const y = top + ry;
        if (row[rx] === '#' && inside(x, y) && canopy[at(x, y)]) {
          cells[at(x, y)] = CELL.TONE_0 + Math.min(4, baseTone(x, y) + 1);
        }
      }
    });
    const underX = left + 2;
    const underY = top + HEART.length;
    if (inside(underX, underY) && canopy[at(underX, underY)]) {
      cells[at(underX, underY)] = CELL.TONE_0 + Math.max(0, baseTone(underX, underY) - 1);
    }
  }

  // --- Blossoms (spring): fixed dots, the same in every pose. ---
  if (blossoms) {
    for (let i = 0; i < BLOSSOM_COUNT; i++) {
      const angle = rand(seed + 600 + i) * Math.PI * 2;
      const distance = Math.sqrt(rand(seed + 700 + i)) * 18;
      const x = Math.round(CANOPY_X + Math.cos(angle) * distance);
      const y = Math.round(CANOPY_Y + Math.sin(angle) * distance);
      if (canopy[at(x, y)]) cells[at(x, y)] = CELL.BLOSSOM;
    }
  }

  // --- Outline: every canopy pixel that touches a non-canopy pixel. ---
  for (let y = 0; y < TREE_H; y++) {
    for (let x = 0; x < TREE_W; x++) {
      if (!canopy[at(x, y)]) continue;
      const onEdge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(
        ([dx, dy]) => !inside(x + dx, y + dy) || !canopy[at(x + dx, y + dy)],
      );
      if (onEdge) cells[at(x, y)] = CELL.OUTLINE;
    }
  }

  return { width: TREE_W, height: TREE_H, cells };
}
