// Idle life: a cat that wanders and sits, two chickens that peck, and birds
// that sometimes cross the sky. They stay in during bad weather (the
// `critters` flag in themeConfig), and the chickens and birds sleep at night.
//
// As everywhere in the scene, positions are worked out from the time alone.

import { rect, type Ctx, type Layer } from '../draw';
import {
  BIRD_FLAP,
  BIRD_PALETTE,
  CAT_PALETTE,
  CAT_SIT,
  CAT_WALK,
  CHICKEN_PALETTE,
  CHICKEN_PECK,
  CHICKEN_STAND,
  drawSprite,
} from '../sprites';

// The cat's routine, repeated: walk right, sit, walk left, sit.
const CAT_LEFT = 214;
const CAT_RIGHT = 292;
const CAT_FEET_Y = 157;
const WALK_SECONDS = 9;
const SIT_SECONDS = 4;

function drawCat(ctx: Ctx, t: number, animated: boolean): void {
  const sitY = CAT_FEET_Y - CAT_SIT.length;
  const walkY = CAT_FEET_Y - CAT_WALK[0].length;
  if (!animated) {
    drawSprite(ctx, CAT_SIT, CAT_LEFT, sitY, CAT_PALETTE); // reduced motion: just sits
    return;
  }
  const time = t % ((WALK_SECONDS + SIT_SECONDS) * 2);
  const frame = CAT_WALK[Math.floor(t * 6) % 2];
  const distance = CAT_RIGHT - CAT_LEFT;

  if (time < WALK_SECONDS) {
    drawSprite(ctx, frame, CAT_LEFT + (time / WALK_SECONDS) * distance, walkY, CAT_PALETTE);
  } else if (time < WALK_SECONDS + SIT_SECONDS) {
    drawSprite(ctx, CAT_SIT, CAT_RIGHT, sitY, CAT_PALETTE);
  } else if (time < WALK_SECONDS * 2 + SIT_SECONDS) {
    const walked = (time - WALK_SECONDS - SIT_SECONDS) / WALK_SECONDS;
    drawSprite(ctx, frame, CAT_RIGHT - walked * distance, walkY, CAT_PALETTE, true);
  } else {
    drawSprite(ctx, CAT_SIT, CAT_LEFT, sitY, CAT_PALETTE, true);
  }
}

function drawChickens(ctx: Ctx, t: number): void {
  const spots = [
    { x: 9, y: 148 },
    { x: 25, y: 153 },
  ];
  spots.forEach((spot, i) => {
    const shuffle = Math.round(Math.sin(t * 0.3 + i * 2) * 3); // drifts a few pixels
    const pecking = Math.sin(t * 1.3 + i * 2.5) > 0.4 && Math.floor(t * 4) % 2 === 0;
    const sprite = pecking ? CHICKEN_PECK : CHICKEN_STAND;
    drawSprite(ctx, sprite, spot.x + shuffle, spot.y - sprite.length, CHICKEN_PALETTE, i === 1);
    rect(ctx, spot.x + shuffle + 1, spot.y, 5, 1, 'rgba(0, 0, 0, 0.12)'); // little shadow
  });
}

function drawBirds(ctx: Ctx, t: number): void {
  // The flock takes ~9 s to cross, then stays off-screen for the rest of 40 s.
  const lead = ((t * 46) % 1840) - 60;
  for (let i = 0; i < 3; i++) {
    const x = lead - i * 9;
    const y = 30 + Math.sin(t * 0.5) * 4 + (i % 2) * 5;
    drawSprite(ctx, BIRD_FLAP[Math.floor(t * 5 + i) % 2], x, y, BIRD_PALETTE);
  }
}

export const drawCritters: Layer = (ctx, { weather, sky, animated }, t) => {
  if (!weather.critters) return;
  const night = sky.starAmount === 1;

  if (!night) drawChickens(ctx, t);
  drawCat(ctx, t, animated);
  if (!night && animated) drawBirds(ctx, t);
};
