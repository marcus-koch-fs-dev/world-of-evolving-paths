import { fromDay, toDay } from '../dates.js';
import type { Position } from '../types.js';
import { createLookup, type Lookup } from './chains.js';
import { defaultHeight } from './reader.js';
import type { Store } from './types.js';

const WORLD_PER_DAY = 24;
const LANE_GAP = 400;

/** Where a point is in the free arrangement: where the user put it, else its date and the lane of its path. */
export function createFreeReader(store: Store, lookup: Lookup = createLookup(store.paths)) {
  const laneOf = new Map(
    [...store.paths]
      .sort((a, b) => (a.lane ?? 0) - (b.lane ?? 0))
      .map((path, index) => [path.id, (index - (store.paths.length - 1) / 2) * LANE_GAP]),
  );
  return (id: string): Position => {
    const info = lookup.point(id)?.info;
    if (!info) return store.free[id] ?? { x: 0, y: 0 };
    return (
      store.free[id] ?? {
        x: toDay(info.point.date) * WORLD_PER_DAY,
        y: (laneOf.get(info.pathId) ?? 0) + (store.heights.week.points[id] ?? defaultHeight(info)),
      }
    );
  };
}

/** Moves one point to a free position. The levels do not know about it. */
export const moveFreePoint = (store: Store, id: string, to: Position): Store => ({
  ...store,
  free: { ...store.free, [id]: { x: Math.round(to.x), y: Math.round(to.y) } },
});

/** Moves all points of a path by a distance in the free arrangement. */
export function moveFreePath(store: Store, pathId: string, by: Position): Store {
  const read = createFreeReader(store);
  const moved = (store.paths.find((path) => path.id === pathId)?.branches ?? []).flatMap((branch) =>
    branch.points.map((point): [string, Position] => {
      const from = read(point.id);
      return [point.id, { x: Math.round(from.x + by.x), y: Math.round(from.y + by.y) }];
    }),
  );
  return { ...store, free: { ...store.free, ...Object.fromEntries(moved) } };
}

/** The date at an x of the free arrangement, the inverse of how a point without a place is spread over time. */
export const dateAtFreeX = (x: number): string => fromDay(Math.round(x / WORLD_PER_DAY));
