/** One end of a connection: its day number and the height the user gave its point, if any. */
export type HeightAt = { day: number; height?: number };

/**
 * The height on the straight line between two points at a day, for where a connection crosses the edge of a period.
 * A point without a height counts as on its lane (0). Undefined when neither point has a height: then the map places
 * the line itself. The line always takes the heights of its two neighbours, it is never straightened on its own.
 */
export function heightBetween(from: HeightAt, to: HeightAt, day: number): number | undefined {
  if (from.height === undefined && to.height === undefined) return undefined;
  const [a, b] = [from.height ?? 0, to.height ?? 0];
  const length = to.day - from.day;
  if (length <= 0) return a;
  const share = Math.min(1, Math.max(0, (day - from.day) / length));
  return Math.round(a + (b - a) * share);
}
