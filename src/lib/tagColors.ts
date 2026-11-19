// The colours tags get by default. Pure data and helpers — no storage here.

import type { Tag } from '../types';

/** The tag palette, in the order new tags receive it. */
export const TAG_PALETTE = ['#DE7272', '#FFCA88', '#FFF6A9', '#B4E4D6'];

/** The colour for the next new tag: walks through the palette, then starts again. */
export function nextTagColor(existingTagCount: number): string {
  return TAG_PALETTE[existingTagCount % TAG_PALETTE.length];
}

/** The starter tags' colours before the palette above was introduced. */
const OLD_DEFAULT_COLORS: Record<string, string> = {
  coursework: '#3d76a6',
  'job-prep': '#d2603a',
  'side-project': '#4d8a4a',
};
const NEW_DEFAULT_COLORS: Record<string, string> = {
  coursework: TAG_PALETTE[0],
  'job-prep': TAG_PALETTE[1],
  'side-project': TAG_PALETTE[2],
};

/**
 * Give saved starter tags the new palette — but only those still wearing
 * their old default colour. A colour you picked yourself is left alone.
 */
export function recolorOldDefaults(tags: Tag[]): Tag[] {
  return tags.map((tag) =>
    OLD_DEFAULT_COLORS[tag.id] === tag.color.toLowerCase() ? { ...tag, color: NEW_DEFAULT_COLORS[tag.id] } : tag,
  );
}
