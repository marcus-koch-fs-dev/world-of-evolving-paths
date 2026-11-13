/** Where the dragged item lands: the number of items whose middle is above the pointer, within the list. */
export function slotAt(middles: readonly number[], pointerY: number): number {
  return Math.min(middles.length - 1, middles.filter((middle) => middle < pointerY).length);
}

/** The list with one item moved to a place. */
export function movedTo<T>(items: readonly T[], item: T, place: number): T[] {
  const without = items.filter((entry) => entry !== item);
  const at = Math.min(Math.max(0, place), without.length);
  return [...without.slice(0, at), item, ...without.slice(at)];
}
