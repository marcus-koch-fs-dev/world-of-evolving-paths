import type { PointKind } from './types.js';

const GOAL_SIZE = 72;
const POINT_SIZE = 56;
const SIZE_PER_IMPORTANCE = 0.12; // each importance step makes the symbol 12 % bigger

/** Diameter of a point's symbol in world units. Goals are bigger, and so is everything more important. */
export function symbolSize(point: { kind: PointKind; importance?: number }): number {
  const base = point.kind === 'goal' ? GOAL_SIZE : POINT_SIZE;
  return base * (1 + ((point.importance ?? 1) - 1) * SIZE_PER_IMPORTANCE);
}
