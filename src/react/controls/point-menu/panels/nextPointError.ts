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

/** Does the new point come before the one it follows? That is allowed, but the line will run backwards. */
export const isBeforeFollowed = (date: string, followedDate: string): boolean => date !== '' && date < followedDate;
