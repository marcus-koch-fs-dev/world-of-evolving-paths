export type Tier = {
  /** Reached points per week (average) from which the tier applies. */
  min: number;
  name: string;
  /** Line width. */
  width: number;
  /** Glow strength, 0 for none. */
  glow: number;
};

export const TIERS: readonly Tier[] = [
  { min: 0, name: 'Desire path', width: 2, glow: 0 },
  { min: 1, name: 'Path', width: 4, glow: 0 },
  { min: 2, name: 'Road', width: 6, glow: 0.25 },
  { min: 3, name: 'Expressway', width: 9, glow: 0.45 },
  { min: 5, name: 'Highway', width: 13, glow: 0.7 },
];

/** The average runs over this many weeks. */
export const STRENGTH_WEEKS = 4;

const DAYS_PER_WEEK = 7;

/** Index of the tier for an average of reached points per week. */
export function tierOf(perWeek: number): number {
  return TIERS.reduce((tier, candidate, index) => (perWeek >= candidate.min ? index : tier), 0);
}

/** Reached points per week, averaged over the last `STRENGTH_WEEKS` weeks up to and including `day`. */
export function weeklyRate(reachedDays: number[], day: number): number {
  const from = day - DAYS_PER_WEEK * STRENGTH_WEEKS;
  return reachedDays.filter((reached) => reached > from && reached <= day).length / STRENGTH_WEEKS;
}

/** Tier index for a point reached on `day`, given the days of all reached points on its path. */
export function tierAt(reachedDays: number[], day: number): number {
  return tierOf(weeklyRate(reachedDays, day));
}
