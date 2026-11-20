// Draws a Japanese tiled roof (kawara): courses of rounded tiles, darker
// where they overlap, with a few sun-bleached and mossy-dark patches so it
// doesn't look flat. In winter the upper part is covered in snow.

import { rand, type Ctx } from '../../draw';
import { COLORS } from './layout';

export interface RoofShape {
  /** First row of tiles. */
  top: number;
  rows: number;
  /** Left and right ends of the top row; each row below is 1 pixel wider on both sides. */
  left: number;
  right: number;
  /** How many rows from the top are under snow (0 = none). */
  snowRows: number;
  /** Changes the pattern of worn patches, so two roofs don't match. */
  seed: number;
}

const COURSE = 3; // rows per course of tiles
const TILE = 4; // pixels per tile across

function tileColor(x: number, row: number, seed: number): string {
  const course = Math.floor(row / COURSE);
  const rowInCourse = row % COURSE;
  const column = (((x + (course % 2) * 2) % TILE) + TILE) % TILE;
  // Worn patches: a block of a few tiles shares one "dice roll".
  const patch = rand(Math.floor(x / 7) * 31 + course * 17 + seed);
  let tone = 2;
  if (patch > 0.8) tone = 3;
  if (patch < 0.14) tone = 1;
  if (rowInCourse === COURSE - 1) tone -= 1; // shadow where the next course overlaps
  else if (column === 0) tone -= 1; // the groove between two tiles
  else if (rowInCourse === 0 && column === 2) tone += 1; // highlight on the tile's back
  return COLORS.tile[Math.max(0, Math.min(4, tone))];
}

export function drawTiledRoof(ctx: Ctx, shape: RoofShape): void {
  const { top, rows, snowRows, seed } = shape;
  for (let row = 0; row < rows; row++) {
    const left = shape.left - row;
    const right = shape.right + row;
    const y = top + row;
    for (let x = left; x < right; x++) {
      // Snow lies on the upper rows, with a ragged lower edge.
      const snowEdge = snowRows + Math.round(rand(Math.floor(x / 3) + seed) * 2);
      let color: string;
      if (snowRows > 0 && row < snowEdge) {
        color = row === snowEdge - 1 || rand(x * 3 + row * 11) > 0.9 ? COLORS.snowShade : COLORS.snow;
      } else if (x === left || x === right - 1) {
        color = COLORS.tile[0]; // the roof's outer edge
      } else {
        color = tileColor(x, row, seed);
      }
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // The eave: a dark underside, with corners that tip up a little.
  const bottom = top + rows;
  const left = shape.left - rows;
  const right = shape.right + rows;
  ctx.fillStyle = COLORS.tile[0];
  ctx.fillRect(left + 1, bottom, right - left - 2, 1);
  ctx.fillRect(left - 1, bottom - 2, 2, 1);
  ctx.fillRect(right - 1, bottom - 2, 2, 1);
}

/** The cap of round tiles along the top of the main roof. */
export function drawRidge(ctx: Ctx, left: number, right: number, y: number, snow: boolean): void {
  for (let x = left; x < right; x++) {
    const bump = (x - left) % 4 === 0;
    ctx.fillStyle = snow ? COLORS.snow : bump ? COLORS.tile[4] : COLORS.tile[3];
    ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = snow ? COLORS.snowShade : bump ? COLORS.tile[1] : COLORS.tile[2];
    ctx.fillRect(x, y + 1, 1, 1);
  }
  // End caps, one pixel taller.
  ctx.fillStyle = snow ? COLORS.snow : COLORS.tile[1];
  ctx.fillRect(left - 1, y - 1, 2, 3);
  ctx.fillRect(right - 1, y - 1, 2, 3);
}
