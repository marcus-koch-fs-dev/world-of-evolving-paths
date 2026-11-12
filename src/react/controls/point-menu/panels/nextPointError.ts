import type { PointKind } from '../../../../core/index.js';

/** The message to show when a name is empty or only spaces, or null when it is fine. */
export function nameError(title: string): string | null {
  return title.trim() ? null : 'The name is missing.';
}

/** The message to show when the input for a next point is not complete, or null when it is fine. */
export function nextPointError(title: string, date: string): string | null {
  const missingName = nameError(title);
  if (missingName) return missingName;
  if (!date) return 'The date is missing. Every point needs a date.';
  return null;
}

/** A fork point leads on in several ways, so the point after it starts a new branch unless the user says otherwise. */
export const startsNewBranchByDefault = (kind: PointKind, isFork: boolean): boolean => kind === 'crossroad' || isFork;

/** A new branch cannot start before the point it forks from. The same day is fine. */
export const startsBeforeFork = (date: string, forkDate: string, newBranch: boolean): boolean =>
  newBranch && date !== '' && date < forkDate;

/** Does the new point come before the one it follows? That is allowed, but the line will run backwards. */
export const isBeforeFollowed = (date: string, followedDate: string): boolean => date !== '' && date < followedDate;
