import { periodOf, shiftPeriod } from '../calendar.js';
import { fromDay } from '../dates.js';
import type { Level } from './types.js';

/** The key of the arrow where the line of a branch crosses the border that starts on `borderDay`. */
export const arrowKey = (pathId: string, branchId: string, borderDay: number) =>
  `${pathId}/${branchId}@${fromDay(borderDay)}`;

/** The fewest days a period of a level has: a week, 28 days of February, a common year. */
const SHORTEST_PERIOD: Record<Level, number> = { week: 7, month: 28, year: 365 };

const startAfter = (level: Level, day: number): number => shiftPeriod(periodOf(level, fromDay(day)), 1).start;

/**
 * The first days of the periods of a level that lie after `afterDay` and up to `throughDay`: the borders between the
 * periods. A line from a point on `afterDay` to one on `throughDay` crosses all of them.
 */
export function bordersBetween(level: Level, afterDay: number, throughDay: number): number[] {
  const first = startAfter(level, afterDay);
  // No period is shorter than the shortest one, so this many steps reach `throughDay` at the latest
  const steps = Math.max(0, Math.floor((throughDay - first) / SHORTEST_PERIOD[level]));
  const starts = Array.from({ length: steps }).reduce<number[]>(
    (all) => {
      all.push(startAfter(level, all[all.length - 1]));
      return all;
    },
    [first],
  );
  return starts.filter((start) => start <= throughDay);
}
