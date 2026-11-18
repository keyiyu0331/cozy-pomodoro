import { describe, expect, it } from 'vitest';
import type { Ctx } from './draw';
import { mix, rand } from './draw';
import { drawScene } from './drawScene';
import { coverLayout } from './scale';
import { SEASON_ORDER, SEASONS, TIME_ORDER, WEATHER_ORDER, WEATHERS } from './themeConfig';
import * as sprites from './sprites';
import { PARTICLES } from './weather';
import { flashStrength, strikeTime, STRIKE_PERIOD } from './weather/lightning';

/** A stand-in canvas context that accepts any drawing call and counts fillRects. */
function fakeContext(): { ctx: Ctx; rects: () => number } {
  let count = 0;
  const target: Record<string, unknown> = {
    fillRect: (x: number, y: number, w: number, h: number) => {
      if (![x, y, w, h].every(Number.isFinite)) throw new Error(`bad fillRect ${x},${y},${w},${h}`);
      count++;
    },
  };
  const ctx = new Proxy(target, {
    get: (obj, key: string) => obj[key] ?? (() => {}),
    set: () => true,
  }) as unknown as Ctx;
  return { ctx, rects: () => count };
}

describe('drawScene', () => {
  it('draws every season × weather × time of day without errors', () => {
    for (const season of SEASON_ORDER) {
      for (const weather of WEATHER_ORDER) {
        for (const timeOfDay of TIME_ORDER) {
          for (const t of [0, 12.34, 9999.5]) {
            const { ctx, rects } = fakeContext();
            expect(() => drawScene(ctx, { season, weather, timeOfDay }, t)).not.toThrow();
            expect(rects()).toBeGreaterThan(500);
          }
        }
      }
    }
  });

  it('draws fewer things with reduced motion (moving particles are skipped)', () => {
    const state = { season: 'autumn', weather: 'rain', timeOfDay: 'afternoon' } as const;
    const moving = fakeContext();
    const still = fakeContext();
    drawScene(moving.ctx, state, 5, true);
    drawScene(still.ctx, state, 0, false);
    expect(still.rects()).toBeLessThan(moving.rects());
  });
});

describe('weather config', () => {
  it('every particle name used by a weather exists in the PARTICLES table', () => {
    for (const weather of WEATHER_ORDER) {
      for (const name of WEATHERS[weather].particles) {
        expect(PARTICLES[name], `${weather} → ${name}`).toBeDefined();
      }
    }
  });

  it('every season suggests at least two weathers', () => {
    for (const season of SEASON_ORDER) {
      expect(SEASONS[season].suggestedWeather.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('lightning', () => {
  it('strikes once per period, inside that period', () => {
    for (let cycle = 0; cycle < 50; cycle++) {
      const at = strikeTime(cycle);
      expect(at).toBeGreaterThanOrEqual(cycle * STRIKE_PERIOD);
      expect(at).toBeLessThan((cycle + 1) * STRIKE_PERIOD - 1);
    }
  });

  it('flashes right at the strike and is dark just before and well after', () => {
    const at = strikeTime(3);
    expect(flashStrength(at + 0.01)).toBeGreaterThan(0);
    expect(flashStrength(at - 0.05)).toBe(0);
    expect(flashStrength(at + 1)).toBe(0);
  });
});

describe('sprites', () => {
  it('every sprite is a rectangle (all rows the same length)', () => {
    const all = [
      ...sprites.CAT_WALK,
      sprites.CAT_SIT,
      sprites.CHICKEN_STAND,
      sprites.CHICKEN_PECK,
      ...sprites.BIRD_FLAP,
    ];
    for (const sprite of all) {
      expect(new Set(sprite.map((row) => row.length)).size).toBe(1);
    }
  });

  it('drawSprite paints one pixel per letter and skips dots', () => {
    const { ctx, rects } = fakeContext();
    sprites.drawSprite(ctx, ['a.a', '.a.'], 0, 0, { a: '#000000' });
    expect(rects()).toBe(3);
  });
});

describe('themeConfig', () => {
  it('gives every season the same set of UI colours', () => {
    const keys = Object.keys(SEASONS.spring.ui).sort();
    for (const season of SEASON_ORDER) {
      expect(Object.keys(SEASONS[season].ui).sort()).toEqual(keys);
    }
  });
});

describe('coverLayout', () => {
  it('uses a whole-number scale that covers the window', () => {
    expect(coverLayout(1280, 720)).toEqual({ scale: 4, width: 1280, height: 720, left: 0, top: 0 });
    for (const [w, h] of [[1440, 900], [390, 844], [1000, 300], [200, 100]]) {
      const layout = coverLayout(w, h);
      expect(Number.isInteger(layout.scale)).toBe(true);
      expect(layout.width).toBeGreaterThanOrEqual(w);
      expect(layout.height).toBeGreaterThanOrEqual(h);
    }
  });

  it('centres the overflow', () => {
    // 1440×900 needs 5× (1600×900): 160px too wide, split evenly.
    expect(coverLayout(1440, 900)).toMatchObject({ scale: 5, left: -80, top: 0 });
  });

  it('never goes below 1×', () => {
    expect(coverLayout(0, 0).scale).toBe(1);
  });
});

describe('draw helpers', () => {
  it('mix blends hex colours', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('rgb(0, 0, 0)');
    expect(mix('#000000', '#ffffff', 1)).toBe('rgb(255, 255, 255)');
    expect(mix('#ff0000', '#0000ff', 0.5)).toBe('rgb(128, 0, 128)');
  });

  it('rand is repeatable and within 0..1', () => {
    expect(rand(42)).toBe(rand(42));
    for (let i = 0; i < 100; i++) {
      expect(rand(i)).toBeGreaterThanOrEqual(0);
      expect(rand(i)).toBeLessThan(1);
    }
  });
});
