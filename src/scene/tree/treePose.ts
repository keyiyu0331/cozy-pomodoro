// Builds the PLACEHOLDER tree as a grid of pixels, in three poses: REST and
// two "rustle" poses, A and B. Pure: no canvas, no colours — each cell just
// holds a code (see CELL) saying what kind of pixel it is. treeSprite.ts
// turns the grid into a picture.
//
// The canopy is a big circle plus a ring of smaller overlapping circles (the
// "bumps") — together they make a round, bumpy shape. A rustle pose is the
// SAME tree with a few rim bumps made 1 pixel bigger or smaller, and a few
// interior leaves moved by 1 pixel. Nothing else differs: the trunk, roots,
// shadow and the canopy's position are built by code that never looks at
// the pose.

import { rand } from '../draw';

/** What a cell can be. TONE_0 is the darkest canopy colour, TONE_0 + 4 the lightest. */
export const CELL = {
  EMPTY: 0,
  SHADOW: 1,
  TRUNK_DARK: 2,
  TRUNK: 3,
  TRUNK_LIGHT: 4,
  TONE_0: 5,
  BLOSSOM: 10,
} as const;

export type PoseName = 'rest' | 'a' | 'b';
export const POSE_NAMES: PoseName[] = ['rest', 'a', 'b'];

/** The measurements of a tree of a given size, in pixels. */
export interface TreeShape {
  width: number;
  height: number;
  /** Centre of the canopy inside the grid. */
  canopyX: number;
  canopyY: number;
  /** Roughly where the canopy's edge is, measured from its centre. */
  canopyRadius: number;
  /** The row the tree stands on (bottom of the trunk). */
  baseY: number;
  trunkWidth: number;
  trunkHeight: number;
}

/**
 * @param size 2 = small tree (canopy ~19 px wide), 3 = large (~27 px wide)
 */
export function treeShape(size: number): TreeShape {
  const canopyRadius = 4 * size + 1;
  const reach = Math.ceil(canopyRadius * 1.1) + 2; // room for the bumps to stick out
  const trunkHeight = 6 * size;
  const canopyY = reach;
  const baseY = canopyY + canopyRadius - 3 + trunkHeight; // the canopy overlaps the trunk's top 3 px
  return {
    width: reach * 2,
    height: baseY + 4, // room for the shadow below the trunk
    canopyX: reach,
    canopyY,
    canopyRadius,
    baseY,
    trunkWidth: size + 2,
    trunkHeight,
  };
}

export interface TreePose {
  width: number;
  height: number;
  /** One code per pixel, row by row: cells[y * width + x]. */
  cells: Uint8Array;
}

/** A leaf cluster, drawn one tone lighter than what is under it. */
const LEAF = ['#.#', '###', '.#.'];

interface Bump {
  x: number;
  y: number;
  radius: number;
  /** false for bumps at the bottom, over the trunk and shadow: those never change. */
  canRustle: boolean;
}

function makeBumps(shape: TreeShape, seed: number): Bump[] {
  const r = shape.canopyRadius;
  const count = Math.round(6 + r * 0.45);
  const bumps: Bump[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (rand(seed + i) - 0.5) * 0.2;
    const distance = r * (0.62 + rand(seed + i + 50) * 0.14);
    bumps.push({
      x: shape.canopyX + Math.cos(angle) * distance,
      y: shape.canopyY + Math.sin(angle) * distance,
      radius: r * (0.26 + rand(seed + i + 100) * 0.08),
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
 * touch different bumps. Whether a bump grows or shrinks is random.
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

/** How a leaf cluster is moved in a pose: some shift by 1 px in A, some others in B. */
function leafShift(i: number, pose: PoseName): { dx: number; dy: number } {
  if (pose === 'a' && i % 3 === 0) return { dx: i % 2 === 0 ? 1 : -1, dy: 0 };
  if (pose === 'b' && i % 3 === 1) return { dx: 0, dy: i % 2 === 0 ? 1 : -1 };
  return { dx: 0, dy: 0 };
}

/**
 * @param seed     different seeds give differently shaped trees
 * @param size     2 = small, 3 = large (see treeShape)
 * @param blossoms dot the canopy with blossom cells (spring)
 */
export function buildTreePose(pose: PoseName, seed: number, size: number, blossoms = false): TreePose {
  const shape = treeShape(size);
  const { width, height, canopyX, canopyY, canopyRadius: r, baseY } = shape;
  const cells = new Uint8Array(width * height);
  const at = (x: number, y: number) => y * width + x;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height;

  /** Lighting: 4 (lightest) at the top-left, down to 0 (darkest) at the bottom-right. */
  const baseTone = (x: number, y: number) => {
    const light = (-(x - canopyX) * 0.55 - (y - canopyY) * 0.83) / r;
    return Math.max(0, Math.min(4, Math.round(2 + light * 2.4)));
  };

  // --- Shadow and trunk: identical in every pose. ---
  const shadowRx = r * 0.85;
  const shadowRy = Math.max(2, r * 0.2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ex = (x - canopyX + 0.5) / shadowRx;
      const ey = (y - baseY + 0.5) / shadowRy;
      if (ex * ex + ey * ey <= 1) cells[at(x, y)] = CELL.SHADOW;
    }
  }
  const trunkLeft = canopyX - Math.floor(shape.trunkWidth / 2);
  for (let y = baseY - shape.trunkHeight; y < baseY; y++) {
    for (let i = 0; i < shape.trunkWidth; i++) {
      cells[at(trunkLeft + i, y)] =
        i === 0 ? CELL.TRUNK_LIGHT : i === shape.trunkWidth - 1 ? CELL.TRUNK_DARK : CELL.TRUNK;
    }
  }
  // Roots: the bottom row is one pixel wider on each side.
  cells[at(trunkLeft - 1, baseY - 1)] = CELL.TRUNK;
  cells[at(trunkLeft + shape.trunkWidth, baseY - 1)] = CELL.TRUNK_DARK;

  // --- Canopy shape: the core circle plus every bump (nudged in A and B). ---
  const bumps = makeBumps(shape, seed);
  const nudges = bumpNudges(bumps, pose, seed);
  const circles = [
    { x: canopyX, y: canopyY, radius: r * 0.72 },
    ...bumps.map((bump, i) => ({ x: bump.x, y: bump.y, radius: bump.radius + (nudges.get(i) ?? 0) })),
  ];
  const canopy = new Uint8Array(width * height); // 1 = this pixel is canopy
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const covered = circles.some((c) => (x - c.x) ** 2 + (y - c.y) ** 2 <= c.radius ** 2);
      if (covered) {
        canopy[at(x, y)] = 1;
        cells[at(x, y)] = CELL.TONE_0 + baseTone(x, y);
      }
    }
  }

  // --- Leaf clusters: small shapes one tone lighter, with a darker pixel beneath. ---
  const leafCount = Math.round(r * 0.9);
  for (let i = 0; i < leafCount; i++) {
    const angle = rand(seed + 400 + i) * Math.PI * 2;
    const distance = Math.sqrt(rand(seed + 500 + i)) * r * 0.6;
    const shift = leafShift(i, pose);
    const left = Math.round(canopyX + Math.cos(angle) * distance) - 1 + shift.dx;
    const top = Math.round(canopyY + Math.sin(angle) * distance) - 1 + shift.dy;
    LEAF.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        const x = left + rx;
        const y = top + ry;
        if (row[rx] === '#' && inside(x, y) && canopy[at(x, y)]) {
          cells[at(x, y)] = CELL.TONE_0 + Math.min(4, baseTone(x, y) + 1);
        }
      }
    });
    const underX = left + 1;
    const underY = top + LEAF.length;
    if (inside(underX, underY) && canopy[at(underX, underY)]) {
      cells[at(underX, underY)] = CELL.TONE_0 + Math.max(0, baseTone(underX, underY) - 1);
    }
  }

  // --- Blossoms (spring): fixed dots, the same in every pose. ---
  if (blossoms) {
    const blossomCount = Math.round(r * 0.8);
    for (let i = 0; i < blossomCount; i++) {
      const angle = rand(seed + 600 + i) * Math.PI * 2;
      const distance = Math.sqrt(rand(seed + 700 + i)) * r * 0.65;
      const x = Math.round(canopyX + Math.cos(angle) * distance);
      const y = Math.round(canopyY + Math.sin(angle) * distance);
      if (canopy[at(x, y)]) cells[at(x, y)] = CELL.BLOSSOM;
    }
  }

  return { width, height, cells };
}
