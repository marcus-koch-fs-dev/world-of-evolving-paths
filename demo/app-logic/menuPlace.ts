import type { MenuPlacement } from 'world-of-evolving-paths/react';

const AROUND: readonly MenuPlacement[] = ['auto', 'above', 'right', 'below', 'left'];

/**
 * The next place of the point menu next to its point, going around the point clockwise: above, right, below, left,
 * and back to automatic. Anything else starts at automatic.
 */
export function nextMenuPlace(current: MenuPlacement): MenuPlacement {
  const index = AROUND.indexOf(current);
  return index < 0 ? 'auto' : AROUND[(index + 1) % AROUND.length];
}

/** The place in words, for the hover text. */
export const menuPlaceLabel = (place: MenuPlacement): string =>
  place === 'auto' ? 'automatic' : place === 'above' ? 'over the point' : `${place} of the point`;
