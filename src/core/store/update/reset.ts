import { withoutHeights } from '../layoutEdits.js';
import type { Level, Store } from '../types.js';

/** Lets go of the kept heights of some points and arrows on a level: they fall back to the week or the default. */
export const forgetHeights = (
  store: Store,
  level: Level,
  pointIds: readonly string[],
  arrowKeys: readonly string[],
): Store => withoutHeights(store, level, pointIds, arrowKeys);
