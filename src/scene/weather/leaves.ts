// Windy weather: faint streaks of wind, plus whatever the season blows past —
// petals in spring, leaves in summer and autumn, snow dust in winter
// (the colours come from `windDebris` in themeConfig).

import { SCENE_H, SCENE_W, rand, rect, type Layer } from '../draw';

export const drawLeaves: Layer = (ctx, { season, weather }, t) => {
  // Wind streaks: thin, quick, nearly see-through lines.
  for (let i = 0; i < 12; i++) {
    const speed = 110 + rand(i + 1700) * 80;
    const x = ((rand(i + 1800) * SCENE_W + t * speed) % (SCENE_W + 40)) - 20;
    const y = 10 + rand(i + 1900) * 140;
    rect(ctx, x, y, 8 + rand(i + 2000) * 10, 1, 'rgba(255, 255, 255, 0.22)');
  }

  // Debris: tumbles to the right, sinking slowly and bobbing up and down.
  const pieces = Math.round(46 * weather.intensity);
  for (let i = 0; i < pieces; i++) {
    const speed = 45 + rand(i + 2100) * 45;
    const x = ((rand(i + 2200) * SCENE_W + t * speed) % (SCENE_W + 10)) - 5;
    const y = ((rand(i + 2300) * SCENE_H + t * 9) % SCENE_H) + Math.sin(t * 2 + i) * 5;
    const flat = Math.floor(t * 4 + i) % 2 === 0; // flips between wide and tall = "fluttering"
    rect(ctx, x, y, flat ? 2 : 1, flat ? 1 : 2, season.windDebris[i % season.windDebris.length]);
  }
};
