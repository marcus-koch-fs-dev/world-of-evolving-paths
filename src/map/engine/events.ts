import type { PlacedPoint, Position } from '../../core/types.js';
import type { PointMoveEvent } from '../options.js';

/** A position with whole numbers, so the data the app stores stays tidy. */
export const rounded = (position: Position): Position => ({ x: Math.round(position.x), y: Math.round(position.y) });

type Lanes = Readonly<Record<string, number>>;

/**
 * The height from its lane of every point, by id: where the point is minus the lane of its path (`lanes` by path id).
 * `lanes` is required on purpose: without it an offset would silently be a world position.
 */
export function offsetsOf(
  points: readonly PlacedPoint[],
  lanes: Lanes,
  positionOf: (point: PlacedPoint) => Position = rounded,
): Record<string, number> {
  return Object.fromEntries(points.map((point) => [point.id, positionOf(point).y - (lanes[point.pathId] ?? 0)]));
}

/**
 * The event for a point that came to rest: its position, its height from the lane of its path, where every point of
 * the view is, and the height from its lane of every point of the view.
 */
export function buildMoveEvent(points: PlacedPoint[], id: string, position: Position, lanes: Lanes): PointMoveEvent {
  const final = rounded(position);
  const landed = (point: PlacedPoint) => (point.id === id ? final : rounded(point));
  // fromEntries defines own keys, so an id such as "__proto__" stays a key
  const positions: Record<string, Position> = Object.fromEntries(points.map((point) => [point.id, landed(point)]));
  const offsets = offsetsOf(points, lanes, landed);
  return { id, ...final, offset: offsets[id], offsets, positions };
}
