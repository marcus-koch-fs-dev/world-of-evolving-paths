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

// The levels the demo offers at first. The user can switch the others on in the settings.
export const DEFAULT_LEVELS: ViewLevel[] = ['week', 'month', 'halfYear', 'year'];

/**
 * The levels after one was switched on or off. They keep the order of the view bar, and there is always at least one:
 * switching off the last one changes nothing.
 */
export function toggledLevels(levels: readonly ViewLevel[], level: ViewLevel, on: boolean): ViewLevel[] {
  const wanted = on ? [...levels, level] : levels.filter((existing) => existing !== level);
  const ordered = VIEW_LEVELS.map((option) => option.level).filter((candidate) => wanted.includes(candidate));
  return ordered.length > 0 ? ordered : [...levels];
}
