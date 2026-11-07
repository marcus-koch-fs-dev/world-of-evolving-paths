import type { PlacedPoint, Position } from '../../core/types';
import type { PointMoveEvent } from '../options';

/** A position with whole numbers, so the data the app stores stays tidy. */
export const rounded = (position: Position): Position => ({ x: Math.round(position.x), y: Math.round(position.y) });

/** The event for a point that came to rest: its position, and where every point of the view is. */
export function buildMoveEvent(points: PlacedPoint[], id: string, position: Position): PointMoveEvent {
  const positions = Object.fromEntries(points.map((point) => [point.id, rounded(point)]));
  const final = rounded(position);
  positions[id] = final;
  return { id, ...final, positions };
}
