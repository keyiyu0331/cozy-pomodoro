// Export / import of ALL app data as one JSON file. Pure functions: they
// build or check plain objects and never touch the stores or the disk.
// (lib/backup.ts does the actual reading/writing of stores and files.)

import type { DailyReview, SessionRecord, Settings, Tag } from '../types';

export const SCHEMA_VERSION = 1;

export interface ExportFile {
  app: 'hearth';
  schemaVersion: number;
  exportedAt: number; // epoch ms
  settings: Settings;
  tags: Tag[];
  sessions: SessionRecord[];
  reviews: DailyReview[];
}

export function buildExport(
  data: Pick<ExportFile, 'settings' | 'tags' | 'sessions' | 'reviews'>,
  now: number,
): ExportFile {
  return { app: 'hearth', schemaVersion: SCHEMA_VERSION, exportedAt: now, ...data };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSession(value: unknown): value is SessionRecord {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.startedAt === 'number' &&
    typeof value.endedAt === 'number' &&
    typeof value.actualMinutes === 'number' &&
    typeof value.completed === 'boolean'
  );
}

function isTag(value: unknown): value is Tag {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string'
  );
}

function isReview(value: unknown): value is DailyReview {
  return isObject(value) && typeof value.date === 'string';
}

/** Upgrade a file written by an older version. Nothing to do yet at v1. */
function migrate(data: Record<string, unknown>): Record<string, unknown> {
  // Example for the future:
  // if (data.schemaVersion === 1) { ...change shape...; data.schemaVersion = 2; }
  return data;
}

/**
 * Read the text of an export file. Throws an Error with a readable message
 * if it isn't a Hearth export. `defaults` fills in any missing settings.
 */
export function parseImport(text: string, defaults: Settings): ExportFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!isObject(raw) || raw.app !== 'hearth' || typeof raw.schemaVersion !== 'number') {
    throw new Error('That file is not a Hearth export.');
  }
  if (raw.schemaVersion > SCHEMA_VERSION) {
    throw new Error('That file was made by a newer version of Hearth.');
  }
  const data = migrate(raw);

  const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
  return {
    app: 'hearth',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: typeof data.exportedAt === 'number' ? data.exportedAt : 0,
    settings: { ...defaults, ...(isObject(data.settings) ? (data.settings as Partial<Settings>) : {}) },
    tags: list(data.tags).filter(isTag),
    sessions: list(data.sessions).filter(isSession),
    reviews: list(data.reviews).filter(isReview),
  };
}
