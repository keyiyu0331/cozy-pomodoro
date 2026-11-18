import { describe, expect, it } from 'vitest';
import type { ActiveSession, SessionRecord, Settings } from '../types';
import { buildSessionRecord } from './sessionRecord';
import { dayKey, formatMinutes, recentIntentions, sessionsOnDay, totalMinutes } from './stats';
import { buildExport, parseImport } from './storage';
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

  it('rejects files that are not Hearth exports', () => {
    expect(() => parseImport('not json', defaults)).toThrow('not valid JSON');
    expect(() => parseImport('{"hello":1}', defaults)).toThrow('not a Hearth export');
    expect(() => parseImport('[1,2]', defaults)).toThrow('not a Hearth export');
    expect(() => parseImport('{"app":"hearth","schemaVersion":99}', defaults)).toThrow('newer version');
  });

  it('drops broken entries instead of failing', () => {
    const text = JSON.stringify({
      app: 'hearth',
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
