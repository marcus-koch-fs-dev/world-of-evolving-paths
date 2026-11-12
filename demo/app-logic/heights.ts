import type { HeightLevel } from './heightLevel';

type Heights = Record<string, number>;

/** The heights of the points, or of the lines across a view, for each level. A height is a distance from the lane. */
export type LevelHeights = Record<HeightLevel, Heights>;

export const emptyHeights = (): LevelHeights => ({ week: {}, month: {}, year: {} });

/** A record without some keys. */
export function omitKeys<T>(record: Record<string, T>, keys: Iterable<string>): Record<string, T> {
  const dropped = new Set(keys);
  return Object.fromEntries(Object.entries(record).filter(([key]) => !dropped.has(key)));
}

/** The heights with one level changed. Without a level (an overview) nothing is kept, so they stay as they are. */
export function changeLevel(
  heights: LevelHeights,
  level: HeightLevel | null,
  change: (current: Heights) => Heights,
): LevelHeights {
  return level === null ? heights : { ...heights, [level]: change(heights[level]) };
}

/** The heights with the same change made on every level. */
export function changeAllLevels(heights: LevelHeights, change: (current: Heights) => Heights): LevelHeights {
  return { week: change(heights.week), month: change(heights.month), year: change(heights.year) };
}
