// The colours tags get by default. Pure data and helpers — no storage here.

import type { Tag } from '../types';

/**
 * The tag palette, in the order new tags receive it: Veranda Blue, Cupid Pink,
 * Sky Cloud, Melon, Lychee. Ordered so neighbours look clearly different;
 * the pale Lychee comes last because it is close to the paper background.
 */
export const TAG_PALETTE = ['#6BB1AD', '#E6748E', '#A7BCBD', '#E5A9A9', '#EDECDB'];

/** The colour for the next new tag: walks through the palette, then starts again. */
export function nextTagColor(existingTagCount: number): string {
  return TAG_PALETTE[existingTagCount % TAG_PALETTE.length];
}

/** Every colour the starter tags have had by default in earlier versions. */
const OLD_DEFAULT_COLORS: Record<string, string[]> = {
  coursework: ['#3d76a6', '#de7272'],
  'job-prep': ['#d2603a', '#ffca88'],
  'side-project': ['#4d8a4a', '#fff6a9'],
};
const NEW_DEFAULT_COLORS: Record<string, string> = {
  coursework: TAG_PALETTE[0],
  'job-prep': TAG_PALETTE[1],
  'side-project': TAG_PALETTE[2],
};

/**
 * Give saved starter tags the current palette — but only those still wearing
 * one of their old default colours. A colour you picked yourself is left alone.
 */
export function recolorOldDefaults(tags: Tag[]): Tag[] {
  return tags.map((tag) =>
    OLD_DEFAULT_COLORS[tag.id]?.includes(tag.color.toLowerCase())
      ? { ...tag, color: NEW_DEFAULT_COLORS[tag.id] }
      : tag,
  );
}
