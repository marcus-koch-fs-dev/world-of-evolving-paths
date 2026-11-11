import type { PlacedPoint, Position } from '../../core/types.js';
import type { PointMoveEvent } from '../options.js';

/** A position with whole numbers, so the data the app stores stays tidy. */
export const rounded = (position: Position): Position => ({ x: Math.round(position.x), y: Math.round(position.y) });

/**
 * The event for a point that came to rest: its position, its height from the lane of its path (`lanes` by path id),
 * and where every point of the view is.
 */
export function buildMoveEvent(
  points: PlacedPoint[],
  id: string,
  position: Position,
  lanes: Readonly<Record<string, number>> = {},
): PointMoveEvent {
  const positions = Object.fromEntries(points.map((point) => [point.id, rounded(point)]));
  const final = rounded(position);
  positions[id] = final;
  const pathId = points.find((point) => point.id === id)?.pathId;
  const lane = pathId === undefined ? 0 : (lanes[pathId] ?? 0);
  return { id, ...final, offset: final.y - lane, positions };
}
