import type { PlacedWorld, Position } from '../types.js';

const NO_SHIFT: Position = { x: 0, y: 0 };

const shifted = <T extends Position>(item: T, by: Position): T => ({ ...item, x: item.x + by.x, y: item.y + by.y });

/**
 * The world with some paths moved by a distance, by path id: their points, their arrows and the lines across the
 * view. It is a preview while the user drags a line, so the whole path goes along. The world it was given is not
 * changed.
 */
export function shiftPaths(world: PlacedWorld, shifts: ReadonlyMap<string, Position>): PlacedWorld {
  if (shifts.size === 0) return world;
  const by = (pathId: string) => shifts.get(pathId) ?? NO_SHIFT;
  return {
    ...world,
    points: world.points.map((point) => shifted(point, by(point.pathId))),
    arrows: world.arrows.map((arrow) => shifted(arrow, by(arrow.pathId))),
    spans: world.spans.map((span) => ({
      ...span,
      before: shifted(span.before, by(span.pathId)),
      after: shifted(span.after, by(span.pathId)),
    })),
  };
}
