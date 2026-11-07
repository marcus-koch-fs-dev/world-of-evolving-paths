import { type Direction, TURNS } from '../../core/orientation.js';
import type { Orientation } from '../options.js';

const isDirection = (value: unknown): value is Direction => typeof value === 'string' && Object.hasOwn(TURNS, value);

/**
 * The direction time runs now. `auto` is vertical while the map is taller than it is wide.
 * A value that is not an orientation (stored data, plain JavaScript) counts as horizontal.
 */
export function resolveOrientation(
  requested: Orientation | undefined,
  size: { width: number; height: number },
): Direction {
  if (requested === 'auto') return size.height > size.width ? 'vertical' : 'horizontal';
  return isDirection(requested) ? requested : 'horizontal';
}
