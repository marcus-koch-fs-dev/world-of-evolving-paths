import { withLevel } from '../levels.js';
import type { Level, Store } from '../types.js';

const without = (record: Record<string, number>, keys: ReadonlySet<string>) =>
  Object.fromEntries(Object.entries(record).filter(([key]) => !keys.has(key)));

/** Lets go of the kept heights of some points and arrows on a level: they fall back to the week or the default. */
export const forgetHeights = (
  store: Store,
  level: Level,
  pointIds: readonly string[],
  arrowKeys: readonly string[],
): Store =>
  withLevel(store, level, (current) => ({
    points: without(current.points, new Set(pointIds)),
    arrows: without(current.arrows, new Set(arrowKeys)),
  }));
