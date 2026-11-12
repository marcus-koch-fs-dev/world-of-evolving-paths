import { fromDay, type Level, type Period } from 'world-of-evolving-paths';

const yearOf = (day: number) => fromDay(day).slice(0, 4);

/**
 * Which heights a period uses, or null when it only gives an overview and keeps none: the free view with everything,
 * and a year view that spans several years.
 */
export function heightLevelOf(period: Period | null): Level | null {
  if (period === null) return null;
  if (period.level !== 'year') return period.level;
  return yearOf(period.start) === yearOf(period.end) ? 'year' : null;
}
