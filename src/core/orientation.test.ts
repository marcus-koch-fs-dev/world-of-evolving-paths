import { describe, expect, it } from 'vitest';
import { type Direction, rotateDirection, TURNS } from './orientation.js';

const DIRECTIONS = Object.keys(TURNS) as Direction[];

describe('Directions of time', () => {
  it.each(DIRECTIONS)('%s gives the original after turning there and back', (direction) => {
    const original = { x: 30, y: -12, id: 'a' };

    const there = TURNS[direction].toScreen(original);

    expect(TURNS[direction].toLayout(there)).toEqual(original);
  });

  it('lets time run along the screen the way the name says', () => {
    const early = { x: 0, y: 5 };
    const late = { x: 100, y: 5 };
    const on = (direction: Direction) => [TURNS[direction].toScreen(early), TURNS[direction].toScreen(late)];

    const [horizontalEarly, horizontalLate] = on('horizontal');
    const [invertedEarly, invertedLate] = on('horizontal-inverted');
    const [downEarly, downLate] = on('vertical');
    const [upEarly, upLate] = on('vertical-inverted');

    expect(horizontalLate.x).toBeGreaterThan(horizontalEarly.x);
    expect(invertedLate.x).toBeLessThan(invertedEarly.x);
    expect(downLate.y).toBeGreaterThan(downEarly.y);
    expect(upLate.y).toBeLessThan(upEarly.y);
  });

  it('keeps the other properties of the position', () => {
    expect(TURNS.vertical.toScreen({ x: 1, y: 2, radius: 9 })).toEqual({ x: 2, y: 1, radius: 9 });
  });
});

describe('Rotating the direction of time', () => {
  describe('when turning right four times', () => {
    it('visits every direction and comes back to the start', () => {
      const first = rotateDirection('horizontal', 'right');
      const second = rotateDirection(first, 'right');
      const third = rotateDirection(second, 'right');
      const fourth = rotateDirection(third, 'right');

      expect([first, second, third, fourth]).toEqual([
        'vertical',
        'horizontal-inverted',
        'vertical-inverted',
        'horizontal',
      ]);
    });
  });

  describe('when turning left', () => {
    it.each(DIRECTIONS)('undoes a turn to the right from %s', (direction) => {
      const turned = rotateDirection(direction, 'right');

      expect(rotateDirection(turned, 'left')).toBe(direction);
    });
  });
});
