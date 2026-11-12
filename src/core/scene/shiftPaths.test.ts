import { describe, expect, it } from 'vitest';
import { makePoint } from '../../../tests/fixtures.js';
import type { PlacedWorld } from '../types.js';
import { shiftPaths } from './shiftPaths.js';

const world: PlacedWorld = {
  today: '2026-11-10',
  period: null,
  paths: [],
  points: [
    { ...makePoint({ id: 'a' }), pathId: 'gym', x: 10, y: 20 },
    { ...makePoint({ id: 'b' }), pathId: 'reading', x: 30, y: 40 },
  ],
};

describe('Shift of paths', () => {
  describe('when a path is shifted', () => {
    it('moves only the points of that path, by the distance', () => {
      const shifted = shiftPaths(world, new Map([['gym', -15]]));

      expect(shifted.points.map(({ id, y }) => [id, y])).toEqual([
        ['a', 5],
        ['b', 40],
      ]);
    });

    it('leaves the world it was given alone', () => {
      shiftPaths(world, new Map([['gym', -15]]));

      expect(world.points[0].y).toBe(20);
    });
  });

  describe('when nothing is shifted', () => {
    it('gives back the same world', () => {
      expect(shiftPaths(world, new Map())).toBe(world);
    });
  });
});
