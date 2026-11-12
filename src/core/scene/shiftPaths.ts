import type { PlacedWorld } from '../types.js';

/**
 * The world with the points of some paths moved up or down by a distance, by path id. It is a preview while the user
 * drags the end of a line: the whole path of the line goes along. The world it was given is not changed.
 */
export function shiftPaths(world: PlacedWorld, shifts: ReadonlyMap<string, number>): PlacedWorld {
  if (shifts.size === 0) return world;
  return {
    ...world,
    points: world.points.map((point) => {
      const shift = shifts.get(point.pathId);
      return shift === undefined ? point : { ...point, y: point.y + shift };
    }),
  };
}
