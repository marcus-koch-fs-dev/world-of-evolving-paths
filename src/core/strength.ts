export type Tier = {
  name: string;
  /** Line width. */
  width: number;
  /** Glow strength, 0 for none. */
  glow: number;
};

export const TIERS: readonly Tier[] = [
  { name: 'Desire path', width: 2, glow: 0 },
  { name: 'Path', width: 4, glow: 0 },
  { name: 'Road', width: 6, glow: 0.25 },
  { name: 'Expressway', width: 9, glow: 0.45 },
  { name: 'Highway', width: 13, glow: 0.7 },
];

/** How active days turn into a tier: a window of weeks, and the active days each tier needs inside it. */
export type StrengthRule = {
  weeks: number;
  /** Active days needed for each tier, same order as `TIERS`. */
  minActiveDays: readonly number[];
};

// A highway takes a real habit: 70 active days in 12 weeks, so almost daily for about ten weeks.
export const STRENGTH_RULE: StrengthRule = { weeks: 12, minActiveDays: [0, 6, 18, 40, 70] };

const DAYS_PER_WEEK = 7;

/** Index of the highest tier whose active days are reached. */
export function tierOf(activeDays: number, rule: StrengthRule = STRENGTH_RULE): number {
  return rule.minActiveDays.reduce((tier, needed, index) => (activeDays >= needed ? index : tier), 0);
}

/** Number of different days with activity in the window of the rule, up to and including `day`. */
export function activeDaysIn(activityDays: readonly number[], day: number, rule: StrengthRule = STRENGTH_RULE): number {
  const from = day - DAYS_PER_WEEK * rule.weeks;
  return new Set(activityDays.filter((active) => active > from && active <= day)).size;
}

/**
 * Tier for a point reached on `day`, given the day numbers of all activity on its path (check-ins, reached points).
 * Several check-ins on one day count once. Also activity that the current view hides must be passed.
 */
export function tierAt(activityDays: readonly number[], day: number, rule: StrengthRule = STRENGTH_RULE): number {
  return tierOf(activeDaysIn(activityDays, day, rule), rule);
}
