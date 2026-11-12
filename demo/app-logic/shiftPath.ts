type Offsets = Readonly<Record<string, number>>;

/**
 * The heights the points have now, for the points whose height is known. Keeping them as they are holds the points in
 * place: a point without a height is placed by the layout and may be pushed aside when something else moves.
 */
export function keptHeights(ids: readonly string[], offsets: Offsets): Record<string, number> {
  return Object.fromEntries(
    ids.flatMap((id): [string, number][] => (Object.hasOwn(offsets, id) ? [[id, offsets[id]]] : [])),
  );
}

/**
 * The heights to keep when the user moves a whole path of a view by `shift`: every point of the path goes by that
 * distance from the height it had. `staying` are the other points of the view. They keep the height they have, so
 * only the path moves and nothing else is pushed around.
 */
export function shiftedHeights(
  pathIds: readonly string[],
  staying: readonly string[],
  offsets: Offsets,
  shift: number,
): Record<string, number> {
  const moved = pathIds.flatMap((id): [string, number][] =>
    Object.hasOwn(offsets, id) ? [[id, Math.round(offsets[id] + shift)]] : [],
  );
  // Points of the path win over staying points that are also on it
  return { ...keptHeights(staying, offsets), ...Object.fromEntries(moved) };
}
