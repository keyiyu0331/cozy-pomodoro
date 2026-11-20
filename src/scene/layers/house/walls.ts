// The two floors of the house: a plaster-and-dark-timber upper floor, and a
// wooden shopfront below with a sliding door, a noren curtain, a signboard
// and a paper lantern. `drawGlass` is separate because it runs twice: with
// dark glass by day, and again with glowing glass after the night tint.

import { disc, rand, rect, type Ctx } from '../../draw';
import {
  BASE,
  COLORS as C,
  DOOR,
  EAVE_TOP,
  L,
  LANTERN,
  LATTICE_WINDOW,
  LOWER_TOP,
  R,
  ROUND_WINDOW,
  SHOP_WINDOW,
  UPPER_TOP,
  UPPER_WINDOW,
} from './layout';

/** Upper floor: cream plaster panels inside a dark timber frame. */
export function drawUpperFloor(ctx: Ctx): void {
  const left = L + 3;
  const width = R - L - 6;
  const height = EAVE_TOP - UPPER_TOP;
  rect(ctx, left, UPPER_TOP, width, height, C.plaster);

  // Weathering: slightly darker blotches, and shade under the roof.
  for (let i = 0; i < 40; i++) {
    rect(ctx, left + rand(i + 40) * (width - 3), UPPER_TOP + 3 + rand(i + 90) * (height - 5), 2 + rand(i) * 2, 1, C.plasterShade);
  }
  rect(ctx, left, UPPER_TOP, width, 2, C.plasterDeep);
  rect(ctx, left, UPPER_TOP + 2, width, 1, C.plasterShade);

  // Timber frame: corner posts, a top beam and a bottom beam, two inner posts.
  rect(ctx, left, UPPER_TOP, 2, height, C.timber);
  rect(ctx, left + width - 2, UPPER_TOP, 2, height, C.timber);
  rect(ctx, left, UPPER_TOP + 3, width, 1, C.timber);
  rect(ctx, left, EAVE_TOP - 2, width, 2, C.timber);
  rect(ctx, UPPER_WINDOW.x - 4, UPPER_TOP + 3, 1, height - 3, C.timberLight);
  rect(ctx, ROUND_WINDOW.x - 9, UPPER_TOP + 3, 1, height - 3, C.timberLight);

  // The wide window's frame, sill and a little railing beneath it.
  const w = UPPER_WINDOW;
  const windowW = w.panes * (w.paneW + 1) + 1;
  rect(ctx, w.x - 1, w.y - 1, windowW + 2, w.h + 2, C.timber);
  rect(ctx, w.x - 2, w.y + w.h + 1, windowW + 4, 1, C.plank[2]);
  for (let x = w.x - 1; x < w.x + windowW + 1; x += 3) rect(ctx, x, w.y + w.h + 2, 1, 3, C.timberLight);
  rect(ctx, w.x - 2, w.y + w.h + 4, windowW + 4, 1, C.plank[1]);

  // The round window's frame.
  disc(ctx, ROUND_WINDOW.x, ROUND_WINDOW.y, ROUND_WINDOW.radius, C.timber);
}

/** Ground floor: plank walls on a stone footing, and everything on them. */
export function drawLowerFloor(ctx: Ctx): void {
  const width = R - L;
  // Planks: 4 rows each, with lighter and darker stretches along their length.
  for (let y = LOWER_TOP; y < BASE - 2; y++) {
    const plank = Math.floor((y - LOWER_TOP) / 4);
    const seam = (y - LOWER_TOP) % 4 === 3;
    for (let x = L; x < R; x++) {
      const stretch = rand(Math.floor((x + plank * 5) / 6) * 3.1 + plank * 41);
      const tone = seam ? 0 : stretch > 0.72 ? 3 : stretch < 0.2 ? 1 : 2;
      ctx.fillStyle = C.plank[tone];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  rect(ctx, L, LOWER_TOP, width, 2, C.timber); // shade under the eave
  rect(ctx, L, LOWER_TOP, 2, BASE - LOWER_TOP, C.timber); // corner posts
  rect(ctx, R - 2, LOWER_TOP, 2, BASE - LOWER_TOP, C.timber);

  // Stone footing.
  for (let x = L - 1; x < R + 1; x++) {
    ctx.fillStyle = C.stone[1 + Math.floor(rand(Math.floor(x / 5) + 7) * 2.99)];
    ctx.fillRect(x, BASE - 2, 1, 2);
  }

  // Lattice window (left): frame now, bars are drawn over the glass.
  const lw = LATTICE_WINDOW;
  rect(ctx, lw.x - 1, lw.y - 1, lw.w + 2, lw.h + 2, C.timber);
  rect(ctx, lw.x - 2, lw.y + lw.h + 1, lw.w + 4, 1, C.plank[3]);

  // Sliding door: frame and two panels with wooden lower thirds.
  rect(ctx, DOOR.x - 1, DOOR.y - 1, DOOR.w + 2, DOOR.h + 1, C.timber);
  rect(ctx, DOOR.x, DOOR.y, DOOR.w, DOOR.h, C.plank[1]);
  rect(ctx, DOOR.x + DOOR.w / 2 - 1, DOOR.y, 2, DOOR.h, C.timber);
  rect(ctx, DOOR.x + 1, DOOR.y + DOOR.h - 6, DOOR.w / 2 - 2, 5, C.plank[2]);
  rect(ctx, DOOR.x + DOOR.w / 2 + 1, DOOR.y + DOOR.h - 6, DOOR.w / 2 - 2, 5, C.plank[2]);

  // Shop window (right) with a bench below it.
  const sw = SHOP_WINDOW;
  rect(ctx, sw.x - 1, sw.y - 1, sw.w + 2, sw.h + 2, C.timber);
  rect(ctx, sw.x - 2, BASE - 7, sw.w + 4, 2, C.plank[3]);
  rect(ctx, sw.x - 2, BASE - 5, sw.w + 4, 1, C.plank[0]);
  rect(ctx, sw.x - 1, BASE - 4, 2, 4, C.plank[1]);
  rect(ctx, sw.x + sw.w - 1, BASE - 4, 2, 4, C.plank[1]);

  // Hanging signboard between the door and the shop window: a tea bowl.
  const sx = DOOR.x + DOOR.w + 2;
  rect(ctx, sx, LOWER_TOP + 3, 5, 14, C.timber);
  rect(ctx, sx + 1, LOWER_TOP + 4, 3, 12, C.paper);
  rect(ctx, sx + 1, LOWER_TOP + 6, 3, 1, C.timber);
  rect(ctx, sx + 2, LOWER_TOP + 8, 1, 3, C.timber);
  rect(ctx, sx + 1, LOWER_TOP + 12, 3, 2, C.norenShade);
}

/** The noren: a split cloth curtain hanging over the top of the doorway. */
export function drawNoren(ctx: Ctx): void {
  const x = DOOR.x - 2;
  const y = DOOR.y - 2;
  const width = DOOR.w + 4;
  rect(ctx, x - 1, y, width + 2, 1, C.timber); // the rod
  rect(ctx, x, y + 1, width, 8, C.noren);
  rect(ctx, x, y + 1, width, 1, C.norenShade);
  rect(ctx, x, y + 8, width, 1, C.norenShade);
  // Two slits make three panels; each panel carries a small pale crest.
  for (let panel = 0; panel < 3; panel++) {
    const px = x + panel * 8;
    if (panel > 0) rect(ctx, px, y + 4, 1, 5, C.glass);
    rect(ctx, px + 3, y + 3, 3, 3, C.norenMark);
    rect(ctx, px + 4, y + 4, 1, 1, C.noren);
  }
}

/** The paper lantern hanging from the eave. `lit` = glowing, at night. */
export function drawLantern(ctx: Ctx, lit: boolean): void {
  const { x, y } = LANTERN;
  rect(ctx, x + 2, y, 1, 2, C.timber); // cord
  rect(ctx, x + 1, y + 2, 3, 1, C.timber); // top cap
  rect(ctx, x, y + 3, 5, 6, lit ? C.lanternLit : C.lantern);
  rect(ctx, x + 1, y + 3, 1, 6, lit ? C.glow : C.lanternShine);
  rect(ctx, x, y + 5, 5, 1, lit ? C.glowDeep : C.norenShade); // a rib
  rect(ctx, x + 1, y + 9, 3, 1, C.timber); // bottom cap
}

/**
 * Every pane of glass, plus the bars in front of it.
 * `lit` = warm light from inside (used by the lights layer at night).
 */
export function drawGlass(ctx: Ctx, lit: boolean): void {
  const pane = lit ? C.glow : C.glass;
  const shine = lit ? C.paper : C.glassShine;

  // Upper window: three panes, each split by a cross bar.
  const w = UPPER_WINDOW;
  for (let i = 0; i < w.panes; i++) {
    const x = w.x + 1 + i * (w.paneW + 1);
    rect(ctx, x, w.y, w.paneW, w.h, pane);
    rect(ctx, x + 1, w.y + 1, 2, 1, shine);
    rect(ctx, x + 1, w.y + 2, 1, 1, shine);
    rect(ctx, x, w.y + 5, w.paneW, 1, C.timber);
    rect(ctx, x + 3, w.y, 1, w.h, C.timberLight);
  }

  // Round window with a cross.
  const rw = ROUND_WINDOW;
  disc(ctx, rw.x, rw.y, rw.radius - 1, pane);
  rect(ctx, rw.x - 2, rw.y - 3, 2, 1, shine);
  rect(ctx, rw.x - rw.radius + 1, rw.y, rw.radius * 2 - 1, 1, C.timber);
  rect(ctx, rw.x, rw.y - rw.radius + 1, 1, rw.radius * 2 - 1, C.timber);

  // Lattice window: glass behind thin upright bars.
  const lw = LATTICE_WINDOW;
  rect(ctx, lw.x, lw.y, lw.w, lw.h, pane);
  for (let x = lw.x + 1; x < lw.x + lw.w; x += 2) rect(ctx, x, lw.y, 1, lw.h, C.plank[2]);
  rect(ctx, lw.x, lw.y + 4, lw.w, 1, C.plank[1]);

  // Door: the upper part of each sliding panel is a paper-and-lattice screen.
  for (const dx of [DOOR.x + 1, DOOR.x + DOOR.w / 2 + 1]) {
    const dw = DOOR.w / 2 - 2;
    rect(ctx, dx, DOOR.y + 7, dw, DOOR.h - 14, lit ? C.glow : C.paper);
    for (let x = dx + 2; x < dx + dw; x += 3) rect(ctx, x, DOOR.y + 7, 1, DOOR.h - 14, C.plank[1]);
    rect(ctx, dx, DOOR.y + 10, dw, 1, C.plank[1]);
  }

  // Shop window: glass with a shelf of small pots and bowls on show.
  const sw = SHOP_WINDOW;
  rect(ctx, sw.x, sw.y, sw.w, sw.h, pane);
  rect(ctx, sw.x + 1, sw.y + 1, 3, 1, shine);
  rect(ctx, sw.x + 1, sw.y + 2, 1, 2, shine);
  rect(ctx, sw.x + sw.w / 2, sw.y, 1, sw.h, C.timber);
  rect(ctx, sw.x, sw.y + sw.h - 3, sw.w, 1, C.plank[2]);
  const wares = [C.norenMark, C.lantern, '#6fa8a0', C.plank[3], '#e9b44c'];
  wares.forEach((color, i) => rect(ctx, sw.x + 1 + i * 3 + (i > 2 ? 2 : 0), sw.y + sw.h - 5, 2, 2, color));
}
