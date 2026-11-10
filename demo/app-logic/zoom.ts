import type { ViewLevel } from 'world-of-evolving-paths';

// The next finer level for each level. The half year is skipped: a double-click goes from the year to the month.
const FINER: Record<ViewLevel, ViewLevel | null> = {
  year: 'month',
  halfYear: 'month',
  month: 'week',
  week: 'day',
  day: null,
};

/** The first level of the chain that the app offers, starting with `level`. */
function firstOffered(level: ViewLevel | null, offered: readonly ViewLevel[]): ViewLevel | null {
  if (level === null) return null;
  return offered.includes(level) ? level : firstOffered(FINER[level], offered);
}

/**
 * The level a double-click on a point goes to: one step finer than the shown level, or the year from the free
 * view. A level the app does not offer is skipped. Where there is nothing finer it is null.
 */
export function finerLevel(level: ViewLevel | null, offered: readonly ViewLevel[]): ViewLevel | null {
  return firstOffered(level === null ? 'year' : FINER[level], offered);
}
