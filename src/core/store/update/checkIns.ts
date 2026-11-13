import { isIsoDate, toDay } from '../../dates.js';
import { activeDaysIn, STRENGTH_RULE, type StrengthRule, TIERS, tierOf } from '../../strength.js';
import type { Store, StorePath } from '../types.js';

/** Changes one path. Every other path keeps its object. */
const mapPath = (store: Store, pathId: string, change: (path: StorePath) => StorePath): Store => ({
  ...store,
  paths: store.paths.map((path) => (path.id === pathId ? change(path) : path)),
});

/** Whether the path has a check-in on that day. */
export const hasCheckedIn = (path: StorePath, date: string): boolean => path.checkIns?.includes(date) ?? false;

/** The days of all check-ins of a path, as day numbers. Pass them to `tierAt`. A date that is not valid is skipped. */
export const checkInDays = (path: StorePath): number[] => (path.checkIns ?? []).filter(isIsoDate).map(toDay);

/**
 * A path is walked on a day (`YYYY-MM-DD`). Checking in twice on one day does not count twice and changes nothing,
 * and neither does a date that is not valid.
 */
export function checkIn(store: Store, pathId: string, date: string): Store {
  const path = store.paths.find((candidate) => candidate.id === pathId);
  return !path || !isIsoDate(date) || hasCheckedIn(path, date)
    ? store
    : mapPath(store, pathId, (found) => ({ ...found, checkIns: [...(found.checkIns ?? []), date].sort() }));
}

/** Takes a check-in back, for example after a tap by mistake. Changes nothing when there was none. */
export function undoCheckIn(store: Store, pathId: string, date: string): Store {
  const path = store.paths.find((candidate) => candidate.id === pathId);
  return !path || !hasCheckedIn(path, date)
    ? store
    : mapPath(store, pathId, (found) => ({ ...found, checkIns: found.checkIns?.filter((day) => day !== date) }));
}

/** What a check-in on one day means for a path. */
export type CheckInStatus = {
  /** The path already has a check-in on that day. */
  checkedIn: boolean;
  /** Active days in the window of the rule, counting the other check-ins but not the one on that day. */
  activeBefore: number;
  /** Active days in the window, with the check-in on that day. Also when it is there already: then it is one more than `activeBefore`, and `tierUp` says whether this day lifts the path. */
  activeAfter: number;
  tierBefore: number;
  tierAfter: number;
  /** The check-in lifts the path to a stronger tier. */
  tierUp: boolean;
  tierName: string;
  /** The next tier and the active days still missing for it, or undefined at the strongest tier. */
  next?: { name: string; daysMissing: number };
  /** The length of the window in weeks. */
  weeks: number;
};

/**
 * What a check-in on `date` does to a path: active days before and after, the tier, and how far the next tier is.
 * Use it for feedback in your own UI ("12 of 18 active days"). It changes nothing. Like `toDay` it throws for a date
 * that is not valid, so check the date first.
 */
export function checkInStatus(path: StorePath, date: string, rule: StrengthRule = STRENGTH_RULE): CheckInStatus {
  const day = toDay(date);
  const others = checkInDays(path).filter((checked) => checked !== day);
  const activeBefore = activeDaysIn(others, day, rule);
  const activeAfter = activeDaysIn([...others, day], day, rule);
  const tierBefore = tierOf(activeBefore, rule);
  const tierAfter = tierOf(activeAfter, rule);
  const needed = rule.minActiveDays[tierAfter + 1];
  return {
    checkedIn: hasCheckedIn(path, date),
    activeBefore,
    activeAfter,
    tierBefore,
    tierAfter,
    tierUp: tierAfter > tierBefore,
    tierName: TIERS[tierAfter].name,
    next: needed === undefined ? undefined : { name: TIERS[tierAfter + 1].name, daysMissing: needed - activeAfter },
    weeks: rule.weeks,
  };
}
