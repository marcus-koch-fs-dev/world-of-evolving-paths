import type { Level, Store, StorePath } from './types.js';

export const LEVELS: readonly Level[] = ['week', 'month', 'year'];

/** The least prio a point needs to show on a level. */
export const MIN_PRIO: Record<Level, number> = { week: 1, month: 3, year: 5 };

/** A store with these paths. */
export const createStore = (paths: StorePath[]): Store => ({ paths });
