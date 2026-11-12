import type { Level, LevelHeights, Store, StorePath } from './types.js';

export const LEVELS: readonly Level[] = ['week', 'month', 'year'];

/** The least prio a point needs to show on a level. */
export const MIN_PRIO: Record<Level, number> = { week: 1, month: 3, year: 5 };

const emptyLevel = (): LevelHeights => ({ points: {}, arrows: {} });

/** A store with these paths and no kept heights or positions. */
export const createStore = (paths: StorePath[]): Store => ({
  paths,
  heights: { week: emptyLevel(), month: emptyLevel(), year: emptyLevel() },
  free: {},
});

/** The store with the heights of one level replaced. */
export function withLevel(store: Store, level: Level, change: (current: LevelHeights) => LevelHeights): Store {
  return { ...store, heights: { ...store.heights, [level]: change(store.heights[level]) } };
}

/** The store with some point heights set on a level. */
export const withPointHeights = (store: Store, level: Level, heights: Record<string, number>): Store =>
  withLevel(store, level, (current) => ({ ...current, points: { ...current.points, ...heights } }));

/** The store with some arrow heights set on a level. */
export const withArrowHeights = (store: Store, level: Level, heights: Record<string, number>): Store =>
  withLevel(store, level, (current) => ({ ...current, arrows: { ...current.arrows, ...heights } }));
