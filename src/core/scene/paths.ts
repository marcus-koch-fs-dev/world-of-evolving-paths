import type { PlacedPoint, PlacedWorld } from '../types';

export const DEFAULT_PATH_COLOR = '#d4f25a';

/** Colors given to new paths, in this order. */
export const PATH_PALETTE = [
  '#ff3b3b',
  '#ff8a1c',
  '#ffd60a',
  '#7ed957',
  '#06d6a0',
  '#3a86ff',
  '#8338ec',
  '#ff2e97',
] as const;

/** Color of the path a point belongs to. */
export function pathColorOf(world: PlacedWorld, point: PlacedPoint): string {
  return world.paths.find((path) => path.id === point.pathId)?.color ?? DEFAULT_PATH_COLOR;
}
