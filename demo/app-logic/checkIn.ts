import { activeDaysIn, STRENGTH_RULE, type StrengthRule, TIERS, tierOf, toDay } from 'world-of-evolving-paths';
import type { CheckIn } from './types';

/** Whether the path already has a check-in on that day. */
export function hasCheckedIn(checkIns: readonly CheckIn[], pathId: string, date: string): boolean {
  return checkIns.some((checkIn) => checkIn.pathId === pathId && checkIn.date === date);
}

/**
 * What a check-in on `date` does to a path, as a short message: active days before and after, the tier,
 * and how many days the next tier still needs. `checkIns` is the list before the check-in.
 */
export function checkInMessage(
  checkIns: readonly CheckIn[],
  path: { id: string; name: string },
  date: string,
  rule: StrengthRule = STRENGTH_RULE,
): string {
  const day = toDay(date);
  const days = checkIns.filter((checkIn) => checkIn.pathId === path.id).map((checkIn) => toDay(checkIn.date));
  const before = activeDaysIn(days, day, rule);
  if (hasCheckedIn(checkIns, path.id, date)) {
    return `${path.name}: already checked in today · ${before} active days in ${rule.weeks} weeks.`;
  }
  const after = activeDaysIn([...days, day], day, rule);
  const tier = tierOf(after, rule);
  const counted = `${before} → ${after} active days in ${rule.weeks} weeks`;
  if (tier > tierOf(before, rule)) return `${path.name} is now a ${TIERS[tier].name}! ${counted}.`;
  const needed = rule.minActiveDays[tier + 1];
  if (needed === undefined) return `${path.name}: ${counted} · ${TIERS[tier].name}, the strongest tier.`;
  return `${path.name}: ${counted} · ${TIERS[tier].name}. ${needed - after} more to ${TIERS[tier + 1].name}.`;
}
