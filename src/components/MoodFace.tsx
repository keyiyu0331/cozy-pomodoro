// Draws one of the pixel faces from lib/moods.ts as a small crisp picture.

import { FACE_COLORS, moodFor, type Rating } from '../lib/moods';

interface Props {
  rating: Rating;
  /** Width and height in CSS pixels. Multiples of 12 look sharpest. */
  size: number;
}

export function MoodFace({ rating, size }: Props) {
  const { face } = moodFor(rating);
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      {face.flatMap((row, y) =>
        [...row].map((pixel, x) =>
          pixel === '.' ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={FACE_COLORS[pixel]} />
          ),
        ),
      )}
    </svg>
  );
}
