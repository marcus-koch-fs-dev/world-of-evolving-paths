import type { ViewLevel } from 'world-of-evolving-paths';

/** The free view shows everything that is at least this important. */
export const FREE_VIEW_MIN_IMPORTANCE = 2;

/**
 * What each view shows is the app's decision, not the library's.
 * `minImportance`: points less important than this are left out. `graphsPerPage`: paths on one page.
 */
export const LEVEL_SETTINGS: Record<ViewLevel, { minImportance: number; graphsPerPage: number }> = {
  day: { minImportance: 1, graphsPerPage: 3 },
  week: { minImportance: 1, graphsPerPage: 3 },
  month: { minImportance: 2, graphsPerPage: 3 },
  halfYear: { minImportance: 3, graphsPerPage: 3 },
  year: { minImportance: 3, graphsPerPage: 3 },
};

/** The levels the demo offers at first. The user can switch the others on in the settings. */
export const DEFAULT_LEVELS: ViewLevel[] = ['week', 'month', 'halfYear', 'year'];
