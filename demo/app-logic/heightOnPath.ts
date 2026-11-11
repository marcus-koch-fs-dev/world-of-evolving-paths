/**
 * The height of a position as a distance from the lane of a path, or null when the path has no lane in this view
 * (it is on another page). A height must never be worked out against a guessed lane: it would be a world position,
 * and the point would sit far from its path in any other view.
 */
export function heightOnPath(y: number, lanes: Readonly<Record<string, number>>, pathId: string): number | null {
  const lane = lanes[pathId];
  return lane === undefined ? null : Math.round(y - lane);
}
