import { checkInStatus, STRENGTH_RULE, type StorePath, type StrengthRule } from 'world-of-evolving-paths';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * What a check-in on `date` does to a path, as a short message: active days before and after, the tier,
 * and how many days the next tier still needs. The status comes from the library, only the words are the demo's.
 */
export function checkInMessage(path: StorePath, date: string, rule: StrengthRule = STRENGTH_RULE): string {
  const status = checkInStatus(path, date, rule);
  const window = plural(status.weeks, 'week');
  if (status.checkedIn) {
    return `${path.name}: already checked in today · ${plural(status.activeAfter, 'active day')} in ${window}.`;
  }
  const counted = `${status.activeBefore} → ${plural(status.activeAfter, 'active day')} in ${window}`;
  if (status.tierUp) return `${path.name} is now a ${status.tierName}! ${counted}.`;
  if (!status.next) return `${path.name}: ${counted} · ${status.tierName}, the strongest tier.`;
  return `${path.name}: ${counted} · ${status.tierName}. ${status.next.daysMissing} more to ${status.next.name}.`;
}
