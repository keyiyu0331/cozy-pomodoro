// The three answers to "How did it go?" after a focus session, and the little
// pixel face shown for each. Pure data.
//
// A session's `rating` is stored as 1, 2 or 3 (as it always was — sessions
// rated with hearts before simply read as these moods now).
//
// Each face is a 12×12 picture written as text: one string per row, one
// letter per pixel, '.' = see-through. FACE_COLORS says what each letter is.

import type { SessionRecord } from '../types';

export type Rating = NonNullable<SessionRecord['rating']>;

export interface Mood {
  rating: Rating;
  label: string;
  face: string[];
}

export const FACE_COLORS: Record<string, string> = {
  o: '#e08a1e', // outline
  y: '#ffcc33', // face
  d: '#5a2e12', // eyes, brows, mouth
  w: '#ffffff', // whites of the eyes
  p: '#ff9a8a', // blush
  h: '#ff5a7a', // heart eyes
  s: '#ffd84a', // sparkle
};

export const MOODS: Mood[] = [
  {
    rating: 1,
    label: 'Distracted',
    face: [
      '....oooo....',
      '..ooyyyyoo..',
      '.oyyyyyyyyo.',
      '.oyydyydyyo.',
      'oyddyyyyddyo',
      'oyoooyyoooyo',
      'oywdwyywdwyo',
      'oyyyyyyyyyyo',
      '.oyyyddyyyo.',
      '.oyyyyyyyyo.',
      '..ooyyyyoo..',
      '....oooo....',
    ],
  },
  {
    rating: 2,
    label: 'Neutral',
    face: [
      '....oooo....',
      '..ooyyyyoo..',
      '.oyyyyyyyyo.',
      '.oyyyyyyyyo.',
      'oyydyyyydyyo',
      'oydydyydydyo',
      'oppyyyyyyppo',
      'oyydyyyydyyo',
      '.oyyddddyyo.',
      '.oyyyyyyyyo.',
      '..ooyyyyoo..',
      '....oooo....',
    ],
  },
  {
    rating: 3,
    label: 'Focused',
    face: [
      '....oooo..s.',
      '..ooyyyyoo.s',
      '.oyyyyyyyyo.',
      '.oyyyyyyyyo.',
      'oyhyhyyhyhyo',
      'oyhhhyyhhhyo',
      'oyyhyyyyhyyo',
      'oyyydyydyyyo',
      '.oyyyddyyyo.',
      '.oyyyyyyyyo.',
      's.ooyyyyoo..',
      '.s..oooo....',
    ],
  },
];

export function moodFor(rating: Rating): Mood {
  return MOODS[rating - 1];
}
