import { type Direction, TURNS, type Turn } from '../../core/orientation.js';
import type { Orientation } from '../options.js';
import { resolveOrientation } from './orientation.js';

export type OrientationState = {
  direction(): Direction;
  /** Turns a position of the layout for the screen. */
  toScreen: Turn;
  /** Turns a position on the screen back to the layout. */
  toLayout: Turn;
  /** Applies the orientation option to the current size of the map. True when the direction changed. */
  sync(requested: Orientation | undefined, size: { width: number; height: number }): boolean;
};

/**
 * The direction time runs on the screen. The layout always has time along x, from left to right. The direction turns
 * what is drawn and shown, so what comes in from the screen (pointer positions) is turned back to the layout's frame,
 * and what goes out (events) is not turned.
 */
export function createOrientationState(): OrientationState {
  let direction: Direction = 'horizontal';

  return {
    direction: () => direction,
    toScreen: (position) => TURNS[direction].toScreen(position),
    toLayout: (position) => TURNS[direction].toLayout(position),
    sync(requested, size) {
      const next = resolveOrientation(requested, size);
      const changed = next !== direction;
      direction = next;
      return changed;
    },
  };
}
