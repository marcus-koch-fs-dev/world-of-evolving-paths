import { collisionRadius } from '../collision';
import type { PlacedWorld } from '../types';
import type { RingDraw } from './types';

const NEIGHBOUR_REACH = 3; // other points show their ring when the dragged point comes within this many radii

/**
 * While a point is dragged, shows how much room it keeps: a ring around the dragged point and around
 * the points close to it. Without a dragged point there are no rings.
 */
export function buildRings(world: PlacedWorld, dragging: string | null): RingDraw[] {
  const dragged = world.points.find((point) => point.id === dragging);
  if (!dragged) return [];
  const reach = collisionRadius(dragged) * NEIGHBOUR_REACH;
  return world.points
    .filter((point) => point.id === dragged.id || Math.hypot(point.x - dragged.x, point.y - dragged.y) <= reach)
    .map((point) => ({
      id: point.id,
      x: point.x,
      y: point.y,
      radius: collisionRadius(point),
      dragged: point.id === dragged.id,
    }));
}
