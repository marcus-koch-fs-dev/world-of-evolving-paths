import { MIN_PRIO, VIEW_LEVELS, type ViewLevel } from 'world-of-evolving-paths';

// The free view shows every point. Which points a level shows is the core's rule (`MIN_PRIO`).
export const FREE_VIEW_MIN_PRIO = 1;

/** The least prio a point needs to show in a period, or in the free view when there is no period. */
export const minPrioOf = (period: { level: ViewLevel } | null): number =>
  period ? MIN_PRIO[period.level] : FREE_VIEW_MIN_PRIO;

/** The views of the bar, in its order: the levels that are offered, and the shown one even when it is not offered. */
export const viewsInBar = (
  offered: readonly ViewLevel[],
  shown: ViewLevel | null,
): { level: ViewLevel; label: string }[] =>
  VIEW_LEVELS.filter((option) => offered.includes(option.level) || option.level === shown);

/** The widest offered level that shows a point of this prio, or null when none does. */
export function widestLevelShowing(
  prio: number,
  offered: readonly ViewLevel[],
): { level: ViewLevel; label: string } | null {
  return (
    VIEW_LEVELS.filter((option) => offered.includes(option.level) && MIN_PRIO[option.level] <= prio).at(-1) ?? null
  );
}

/**
 * Where a point of this prio shows when the shown view hides it: the widest offered level that is fine
 * enough. Null when the shown view shows it already (or the free view), or no offered level does.
 */
export function levelThatShows(
  prio: number,
  current: ViewLevel | null,
  offered: readonly ViewLevel[],
): { level: ViewLevel; label: string } | null {
  if (current === null || MIN_PRIO[current] <= prio) return null;
  return widestLevelShowing(prio, offered);
}

// The levels the demo offers at first: the week is the finest view and the year the widest. The user can switch
// levels off in the settings.
export const DEFAULT_LEVELS: ViewLevel[] = VIEW_LEVELS.map((option) => option.level);

// How many years the year view can span, in the steps of its counter
export const YEAR_SPANS: readonly number[] = [1, 2, 5, 10];

/** The next span of years in the counter, or the same one at its end. `step` is 1 for more years, -1 for fewer. */
export function steppedYears(years: number, step: 1 | -1): number {
  const index = YEAR_SPANS.findIndex((span) => span >= years);
  const current = index === -1 ? YEAR_SPANS.length - 1 : index;
  return YEAR_SPANS[Math.min(YEAR_SPANS.length - 1, Math.max(0, current + step))];
}

/**
 * The levels after one was switched on or off. They keep the order of the view bar, and there is always at least one:
 * switching off the last one changes nothing.
 */
export function toggledLevels(levels: readonly ViewLevel[], level: ViewLevel, on: boolean): ViewLevel[] {
  const wanted = on ? [...levels, level] : levels.filter((existing) => existing !== level);
  const ordered = VIEW_LEVELS.map((option) => option.level).filter((candidate) => wanted.includes(candidate));
  return ordered.length > 0 ? ordered : [...levels];
}
