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

// A quarter turn to the right: left to right becomes top to bottom, then right to left, then bottom to top
const RIGHT_OF: Record<Direction, Direction> = {
  horizontal: 'vertical',
  vertical: 'horizontal-inverted',
  'horizontal-inverted': 'vertical-inverted',
  'vertical-inverted': 'horizontal',
};
const LEFT_OF = Object.fromEntries(Object.entries(RIGHT_OF).map(([from, to]) => [to, from])) as Record<
  Direction,
  Direction
>;

/** The direction after a quarter turn: to the right (clockwise) or to the left. */
export function rotateDirection(direction: Direction, turn: 'right' | 'left'): Direction {
  return (turn === 'right' ? RIGHT_OF : LEFT_OF)[direction];
}
