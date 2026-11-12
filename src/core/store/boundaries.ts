import { periodOf, shiftPeriod } from '../calendar.js';
import { fromDay } from '../dates.js';
import type { Level } from './types.js';

/** The key of the arrow where the line of a branch crosses the border that starts on `borderDay`. */
export const arrowKey = (pathId: string, branchId: string, borderDay: number) =>
  `${pathId}/${branchId}@${fromDay(borderDay)}`;

/**
 * The first days of the periods of a level that lie after `afterDay` and up to `throughDay`: the borders between the
 * periods. A line from a point on `afterDay` to one on `throughDay` crosses all of them.
 */
export function bordersBetween(level: Level, afterDay: number, throughDay: number): number[] {
  const walk = (start: number): number[] => {
    if (start > throughDay) return [];
    return [start, ...walk(shiftPeriod(periodOf(level, fromDay(start)), 1).start)];
  };
  return walk(shiftPeriod(periodOf(level, fromDay(afterDay)), 1).start);
}
