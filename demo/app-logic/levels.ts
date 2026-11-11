import { VIEW_LEVELS, type ViewLevel } from 'world-of-evolving-paths';

// The free view shows everything that is at least this important.
export const FREE_VIEW_MIN_IMPORTANCE = 2;

// What each view shows is the app's decision, not the library's.
// `minImportance`: points less important than this are left out. `graphsPerPage`: paths on one page.
export const LEVEL_SETTINGS: Record<ViewLevel, { minImportance: number; graphsPerPage: number }> = {
  day: { minImportance: 1, graphsPerPage: 2 },
  week: { minImportance: 1, graphsPerPage: 2 },
  month: { minImportance: 2, graphsPerPage: 2 },
  halfYear: { minImportance: 3, graphsPerPage: 2 },
  year: { minImportance: 3, graphsPerPage: 2 },
};

/** The least importance a point needs to show in a period, or in the free view when there is no period. */
export const minImportanceOf = (period: { level: ViewLevel } | null): number =>
  period ? LEVEL_SETTINGS[period.level].minImportance : FREE_VIEW_MIN_IMPORTANCE;

/** The widest offered level that shows a point of this importance, or null when none does. */
export function widestLevelShowing(
  importance: number,
  offered: readonly ViewLevel[],
): { level: ViewLevel; label: string } | null {
  return (
    VIEW_LEVELS.filter(
      (option) => offered.includes(option.level) && LEVEL_SETTINGS[option.level].minImportance <= importance,
    ).at(-1) ?? null
  );
}

/**
 * Where a point of this importance shows when the shown view hides it: the widest offered level that is fine
 * enough. Null when the shown view shows it already (or the free view), or no offered level does.
 */
export function levelThatShows(
  importance: number,
  current: ViewLevel | null,
  offered: readonly ViewLevel[],
): { level: ViewLevel; label: string } | null {
  if (current === null || LEVEL_SETTINGS[current].minImportance <= importance) return null;
  return widestLevelShowing(importance, offered);
}

// The week is the smallest view the demo offers and the year the widest. The library knows day and half year too.
export const DEMO_LEVELS: readonly ViewLevel[] = ['week', 'month', 'year'];

// The levels the demo offers at first. The user can switch the others on in the settings.
export const DEFAULT_LEVELS: ViewLevel[] = [...DEMO_LEVELS];

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
