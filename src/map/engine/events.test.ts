import { describe, expect, it } from 'vitest';
import { makePoint } from '../../../tests/fixtures.js';
import type { PlacedPoint } from '../../core/types.js';
import { buildMoveEvent, rounded } from './events.js';

const placed = (id: string, x: number, y: number): PlacedPoint => ({ ...makePoint({ id }), x, y });

describe('Move events', () => {
  it('rounds positions to whole numbers', () => {
    expect(rounded({ x: 1.4, y: 2.6 })).toEqual({ x: 1, y: 3 });
  });

  it('reports the moved point and where every point of the view is', () => {
    const points = [placed('a', 10.2, 20.7), placed('b', 30, 40)];

    const event = buildMoveEvent(points, 'a', { x: 55.5, y: 66.4 }, {});

    expect(event).toEqual({
      id: 'a',
      x: 56,
      y: 66,
      offset: 66,
      offsets: { a: 66, b: 40 },
      positions: { a: { x: 56, y: 66 }, b: { x: 30, y: 40 } },
    });
  });

  it('reports the height from its lane of every point of the view', () => {
    const points = [
      { ...placed('a', 10, 20), pathId: 'gym' },
      { ...placed('b', 30, 40), pathId: 'reading' },
    ];

    const event = buildMoveEvent(points, 'a', { x: 10, y: -80 }, { gym: -100, reading: 100 });

    expect(event.offsets).toEqual({ a: 20, b: -60 });
  });

  it('reports the height as a distance from the lane of the path of the point', () => {
    const points = [{ ...placed('a', 10, 20), pathId: 'gym' }];

    const event = buildMoveEvent(points, 'a', { x: 10, y: -80 }, { gym: -100 });

    expect(event.offset).toBe(20);
  });

  describe('when a point id is "__proto__"', () => {
    it('keeps it as a key of positions and offsets', () => {
      const points = [placed('__proto__', 10, 20), placed('b', 30, 40)];

      const event = buildMoveEvent(points, '__proto__', { x: 11, y: 22 }, {});

      expect(Object.keys(event.positions)).toEqual(['__proto__', 'b']);
      expect(Object.getPrototypeOf(event.positions)).toBe(Object.prototype);
      expect(event.offset).toBe(22);
    });
  });
});
