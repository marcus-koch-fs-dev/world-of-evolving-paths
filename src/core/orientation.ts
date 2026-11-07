import type { Position } from './types.js';

// How a position is turned: the layout always has time along x, from left to right
export type Turn = <T extends Position>(position: T) => T;

// The four ways time can run on the screen
export type Direction = 'horizontal' | 'horizontal-inverted' | 'vertical' | 'vertical-inverted';

type Turns = { toScreen: Turn; toLayout: Turn };

const keep: Turn = (position) => position;

/**
 * For each direction: how a position of the layout is turned for the screen and back.
 * Horizontal inverted mirrors time (right to left). Vertical turns it to top to bottom, and vertical inverted to bottom to top.
 */
export const TURNS: Record<Direction, Turns> = {
  horizontal: { toScreen: keep, toLayout: keep },
  'horizontal-inverted': {
    toScreen: (position) => ({ ...position, x: -position.x }),
    toLayout: (position) => ({ ...position, x: -position.x }),
  },
  vertical: {
    toScreen: (position) => ({ ...position, x: position.y, y: position.x }),
    toLayout: (position) => ({ ...position, x: position.y, y: position.x }),
  },
  'vertical-inverted': {
    toScreen: (position) => ({ ...position, x: position.y, y: -position.x }),
    toLayout: (position) => ({ ...position, x: -position.y, y: position.x }),
  },
};
