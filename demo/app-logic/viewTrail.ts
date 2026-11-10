/** How many steps Back remembers. */
export const TRAIL_LIMIT = 50;

/** The trail with one more step on top. The oldest steps fall off when there are too many. */
export function pushStep<T>(trail: readonly T[], step: T, limit = TRAIL_LIMIT): T[] {
  return [...trail, step].slice(-limit);
}

/** The last step and the trail without it. Without a step the step is null and the trail stays empty. */
export function popStep<T>(trail: readonly T[]): { step: T | null; rest: T[] } {
  return { step: trail.at(-1) ?? null, rest: trail.slice(0, -1) };
}
