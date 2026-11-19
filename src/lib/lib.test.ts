import { describe, expect, it } from 'vitest';
import type { ActiveSession, SessionRecord, Settings } from '../types';
import { pruneHistory } from './retention';
import { buildSessionRecord } from './sessionRecord';
import { isReviewDue } from './review';
import {
  addDays,
  currentStreak,
  dayKey,
  formatMinutes,
  growthLevel,
  heatmapWeeks,
  minutesByDay,
  recentIntentions,
  sessionsOnDay,
  totalMinutes,
  weekByTag,
  weekStart,
} from './stats';
import { buildExport, parseImport } from './storage';
import { TAG_PALETTE, nextTagColor, recolorOldDefaults } from './tagColors';
import { timeOfDayAt } from './timeOfDay';

const MIN = 60_000;
const theme = { season: 'spring', weather: 'clear', timeOfDay: 'morning' } as const;

/** Make a session record with sensible defaults; override what the test needs. */
function session(overrides: Partial<SessionRecord>): SessionRecord {
  return {
    id: 'id',
    startedAt: 0,
    endedAt: 25 * MIN,
    plannedMinutes: 25,
    actualMinutes: 25,
    completed: true,
    theme,
    ...overrides,
  };
}

/** Local time on a fixed date, so tests don't depend on the timezone. */
function at(day: number, hour: number): number {
  return new Date(2026, 2, day, hour, 0, 0).getTime();
}

describe('buildSessionRecord', () => {
  const active: ActiveSession = {
    startedAt: 1000,
    plannedMinutes: 25,
    intention: 'Read chapter 3',
    tagId: 'coursework',
    theme,
  };

  it('records a completed session at its full planned length', () => {
    const r = buildSessionRecord('a', active, 1000 + 30 * MIN, 0, true);
    expect(r).toMatchObject({
      id: 'a',
      startedAt: 1000,
      endedAt: 1000 + 30 * MIN,
      plannedMinutes: 25,
      actualMinutes: 25,
      completed: true,
      intention: 'Read chapter 3',
      tagId: 'coursework',
    });
  });

  it('records an abandoned session with only the time actually focused', () => {
    // 15 minutes were left, so 10 were focused — however long it was paused.
    const r = buildSessionRecord('a', active, 1000 + 60 * MIN, 15 * MIN, false);
    expect(r.completed).toBe(false);
    expect(r.actualMinutes).toBe(10);
  });

  it('rounds to one decimal and never goes negative', () => {
    expect(buildSessionRecord('a', active, 0, 25 * MIN - 90_000, false).actualMinutes).toBe(1.5);
    expect(buildSessionRecord('a', active, 0, 99 * MIN, false).actualMinutes).toBe(0);
  });
});

describe('stats', () => {
  it('dayKey gives the local date', () => {
    expect(dayKey(at(7, 9))).toBe('2026-03-07');
    expect(dayKey(at(7, 23))).toBe('2026-03-07');
  });

  it('sessionsOnDay keeps only that day, oldest first', () => {
    const all = [
      session({ id: 'late', startedAt: at(7, 20) }),
      session({ id: 'yesterday', startedAt: at(6, 23) }),
      session({ id: 'early', startedAt: at(7, 8) }),
    ];
    expect(sessionsOnDay(all, '2026-03-07').map((s) => s.id)).toEqual(['early', 'late']);
  });

  it('totalMinutes adds up focused time', () => {
    expect(totalMinutes([])).toBe(0);
    expect(totalMinutes([session({ actualMinutes: 25 }), session({ actualMinutes: 10.5 })])).toBe(35.5);
  });

  it('recentIntentions is newest first, unique, limited, and skips blanks', () => {
    const all = [
      session({ startedAt: 1, intention: 'Essay' }),
      session({ startedAt: 2, intention: 'Leetcode' }),
      session({ startedAt: 3, intention: '  ' }),
      session({ startedAt: 4 }),
      session({ startedAt: 5, intention: 'essay' }),
      session({ startedAt: 6, intention: 'Portfolio' }),
    ];
    expect(recentIntentions(all)).toEqual(['Portfolio', 'essay', 'Leetcode']);
    expect(recentIntentions(all, 1)).toEqual(['Portfolio']);
  });

  it('formatMinutes keeps a decimal only for small values', () => {
    expect(formatMinutes(25)).toBe('25');
    expect(formatMinutes(0.1)).toBe('0.1');
    expect(formatMinutes(35.5)).toBe('36');
  });
});

describe('timeOfDayAt', () => {
  it('maps hours to the four times of day', () => {
    const hour = (h: number) => timeOfDayAt(new Date(2026, 0, 1, h));
    expect([hour(5), hour(11)]).toEqual(['morning', 'morning']);
    expect([hour(12), hour(16)]).toEqual(['afternoon', 'afternoon']);
    expect([hour(17), hour(20)]).toEqual(['evening', 'evening']);
    expect([hour(21), hour(0), hour(4)]).toEqual(['night', 'night', 'night']);
  });
});

describe('export / import', () => {
  const settings = { focusMin: 50, chime: 'rise' } as Settings;
  const defaults = { focusMin: 25, shortBreakMin: 5, chime: 'soft' } as Settings;
  const data = {
    settings,
    tags: [{ id: 't', name: 'Tag', color: '#fff' }],
    sessions: [session({ id: 's1', intention: 'Essay', rating: 3, note: 'Done' })],
    reviews: [{ date: '2026-03-07', wentWell: 'Focus' }],
  };

  it('round-trips everything through JSON', () => {
    const text = JSON.stringify(buildExport(data, 123));
    const parsed = parseImport(text, defaults);
    expect(parsed.exportedAt).toBe(123);
    expect(parsed.tags).toEqual(data.tags);
    expect(parsed.sessions).toEqual(data.sessions);
    expect(parsed.reviews).toEqual(data.reviews);
  });

  it('fills settings missing from the file with defaults', () => {
    const parsed = parseImport(JSON.stringify(buildExport(data, 0)), defaults);
    expect(parsed.settings).toMatchObject({ focusMin: 50, shortBreakMin: 5, chime: 'rise' });
  });

  it('rejects files that are not Cozy Pomodoro exports', () => {
    expect(() => parseImport('not json', defaults)).toThrow('not valid JSON');
    expect(() => parseImport('{"hello":1}', defaults)).toThrow('not a Cozy Pomodoro export');
    expect(() => parseImport('[1,2]', defaults)).toThrow('not a Cozy Pomodoro export');
    expect(() => parseImport('{"app":"cozy-pomodoro","schemaVersion":99}', defaults)).toThrow('newer version');
  });

  it('still accepts exports made under the old name "hearth"', () => {
    const old = JSON.stringify({ app: 'hearth', schemaVersion: 1, sessions: [session({ id: 'old' })] });
    const parsed = parseImport(old, defaults);
    expect(parsed.app).toBe('cozy-pomodoro');
    expect(parsed.sessions.map((s) => s.id)).toEqual(['old']);
    expect(() => parseImport('{"app":"other","schemaVersion":1}', defaults)).toThrow('not a Cozy Pomodoro export');
  });

  it('drops broken entries instead of failing', () => {
    const text = JSON.stringify({
      app: 'cozy-pomodoro',
      schemaVersion: 1,
      sessions: [session({ id: 'ok' }), { id: 5 }, null, 'x'],
      tags: 'oops',
    });
    const parsed = parseImport(text, defaults);
    expect(parsed.sessions.map((s) => s.id)).toEqual(['ok']);
    expect(parsed.tags).toEqual([]);
    expect(parsed.reviews).toEqual([]);
  });
});

describe('pruneHistory', () => {
  const sessions = [
    session({ id: 'today', startedAt: at(10, 9) }),
    session({ id: 'yesterday', startedAt: at(9, 23) }),
    session({ id: 'week', startedAt: at(4, 0) }),
    session({ id: 'old', startedAt: at(3, 23) }),
  ];
  const reviews = [{ date: '2026-03-10' }, { date: '2026-03-09' }, { date: '2026-03-01' }];
  const now = at(10, 15);
  const ids = (days: number) => pruneHistory(sessions, reviews, days, now).sessions.map((s) => s.id);

  it('keeps everything when set to forever (0)', () => {
    expect(pruneHistory(sessions, reviews, 0, now)).toEqual({ sessions, reviews });
  });

  it('"today only" keeps just today, whatever the time of day', () => {
    expect(ids(1)).toEqual(['today']);
    expect(pruneHistory(sessions, reviews, 1, now).reviews).toEqual([{ date: '2026-03-10' }]);
  });

  it('counts whole calendar days, today included', () => {
    expect(ids(2)).toEqual(['today', 'yesterday']);
    expect(ids(7)).toEqual(['today', 'yesterday', 'week']);
    expect(ids(30)).toEqual(['today', 'yesterday', 'week', 'old']);
  });
});

describe('calendar helpers', () => {
  it('addDays crosses month and year ends', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-10', 0)).toBe('2026-03-10');
  });

  it('weekStart finds the Monday', () => {
    expect(weekStart('2026-03-09')).toBe('2026-03-09'); // a Monday
    expect(weekStart('2026-03-11')).toBe('2026-03-09'); // Wednesday
    expect(weekStart('2026-03-15')).toBe('2026-03-09'); // Sunday
  });
});

describe('history stats', () => {
  // Tuesday 10 March 2026, 3pm.
  const now = at(10, 15);
  const all = [
    session({ startedAt: at(10, 9), actualMinutes: 25, tagId: 'a' }),
    session({ startedAt: at(10, 11), actualMinutes: 50, tagId: 'b' }),
    session({ startedAt: at(9, 9), actualMinutes: 30 }),
    session({ startedAt: at(8, 9), actualMinutes: 10, tagId: 'a', completed: false }),
    session({ startedAt: at(2, 9), actualMinutes: 130, tagId: 'a' }),
  ];

  it('minutesByDay adds up each day', () => {
    expect(minutesByDay(all)).toEqual({
      '2026-03-10': 75,
      '2026-03-09': 30,
      '2026-03-08': 10,
      '2026-03-02': 130,
    });
  });

  it('growthLevel steps up with more focus', () => {
    expect([0, 10, 25, 59, 60, 119, 120, 500].map(growthLevel)).toEqual([0, 1, 2, 2, 3, 3, 4, 4]);
  });

  it('heatmapWeeks is whole Monday-to-Sunday weeks ending with this week', () => {
    const grid = heatmapWeeks(all, now, 3);
    expect(grid.length).toBe(3);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid[0][0].day).toBe('2026-02-23');
    expect(grid[2][0].day).toBe('2026-03-09');
    expect(grid[2][6].day).toBe('2026-03-15');

    expect(grid[2][1]).toEqual({ day: '2026-03-10', minutes: 75, level: 3, future: false });
    expect(grid[1][0]).toMatchObject({ day: '2026-03-02', minutes: 130, level: 4 });
    expect(grid[2][2]).toMatchObject({ day: '2026-03-11', minutes: 0, level: 0, future: true });
  });

  it('weekByTag splits each day by tag, with untagged under ""', () => {
    const bars = weekByTag(all, '2026-03-09');
    expect(bars.map((b) => b.day)).toEqual([
      '2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14', '2026-03-15',
    ]);
    expect(bars[0]).toEqual({ day: '2026-03-09', total: 30, byTag: { '': 30 } });
    expect(bars[1]).toEqual({ day: '2026-03-10', total: 75, byTag: { a: 25, b: 50 } });
    expect(bars[2].total).toBe(0);
  });

  it('currentStreak counts completed days back from today', () => {
    // 10th and 9th completed; the 8th was only an abandoned session.
    expect(currentStreak(all, now)).toBe(2);
    expect(currentStreak([], now)).toBe(0);
  });

  it('currentStreak is not broken by a today that has not started yet', () => {
    expect(currentStreak(all, at(11, 8))).toBe(2); // nothing on the 11th yet
    expect(currentStreak(all, at(12, 8))).toBe(0); // the 11th was missed
  });
});

describe('isReviewDue', () => {
  const evening = new Date(2026, 2, 10, 21, 30);
  const today = '2026-03-10';

  it('is due once the chosen time has passed', () => {
    expect(isReviewDue('21:00', evening, false, null)).toBe(true);
    expect(isReviewDue('21:30', evening, false, null)).toBe(true);
    expect(isReviewDue('22:00', evening, false, null)).toBe(false);
  });

  it('is never due when switched off or malformed', () => {
    expect(isReviewDue(undefined, evening, false, null)).toBe(false);
    expect(isReviewDue('', evening, false, null)).toBe(false);
    expect(isReviewDue('soon', evening, false, null)).toBe(false);
  });

  it('asks only once a day, and not if today is already reviewed', () => {
    expect(isReviewDue('21:00', evening, true, null)).toBe(false);
    expect(isReviewDue('21:00', evening, false, today)).toBe(false);
    expect(isReviewDue('21:00', evening, false, '2026-03-09')).toBe(true);
  });
});

describe('tag colours', () => {
  it('hands out the palette in order, then starts again', () => {
    expect(TAG_PALETTE).toEqual(['#6BB1AD', '#E6748E', '#A7BCBD', '#E5A9A9', '#EDECDB']);
    expect([0, 1, 2, 3, 4, 5, 6].map(nextTagColor)).toEqual([...TAG_PALETTE, TAG_PALETTE[0], TAG_PALETTE[1]]);
  });

  it('recolours saved starter tags, but not colours you chose or tags you made', () => {
    const saved = [
      { id: 'coursework', name: 'Uni', color: '#DE7272' }, // previous default, renamed
      { id: 'job-prep', name: 'Job prep', color: '#123456' }, // you changed the colour
      { id: 'side-project', name: 'Side project', color: '#4D8A4A' }, // oldest default, upper case
      { id: 'my-own', name: 'Reading', color: '#3d76a6' }, // your own tag
    ];
    expect(recolorOldDefaults(saved).map((t) => t.color)).toEqual([
      TAG_PALETTE[0],
      '#123456',
      TAG_PALETTE[2],
      '#3d76a6',
    ]);
    expect(recolorOldDefaults(saved)[0].name).toBe('Uni');
  });
});
