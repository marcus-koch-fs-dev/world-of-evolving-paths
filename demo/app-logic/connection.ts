/**
 * The key of a path where it crosses the border between two periods: the last point before the border, the last day
 * before it, and the branch of that point (a point that forks has several lines). The period before the border and the
 * period after it both know these, also when points in between are hidden in the one and shown in the other, so they
 * work out the same key and share one height.
 */
export const boundaryKey = (lastPointBeforeId: string, dayBeforeBorder: number, branch: number) =>
  `${lastPointBeforeId}@${dayBeforeBorder}#${branch}`;

/** Does the key of a border crossing belong to this point? */
export const crossesAt = (key: string, pointId: string) => key.split('@')[0] === pointId;
