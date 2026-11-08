import { describe, expect, it } from 'vitest';
import { shapeRadiusOf } from '../symbol.js';
import type { PlacedPoint } from '../types.js';
import { ringAt } from './heres.js';

const point = { id: 'a', x: 100, y: 50, kind: 'milestone', importance: 1 } as PlacedPoint;

describe('Ring of the Today marker', () => {
  describe('when the marker is in free space', () => {
    it('keeps its own small ring', () => {
      const ring = ringAt({ x: 300, y: 50 }, [point]);

      expect(ring).toEqual({ radius: 11, onPoint: false });
    });
  });

  describe('when the marker rests on a point', () => {
    it('starts the ring outside the drawn circle of that point', () => {
      const ring = ringAt({ x: 100, y: 50 }, [point]);

      expect(ring.onPoint).toBe(true);
      expect(ring.radius).toBeGreaterThan(shapeRadiusOf(point));
    });
  });

  describe('when the marker is just outside the drawn circle', () => {
    it('counts as free space', () => {
      const edge = shapeRadiusOf(point);

      const ring = ringAt({ x: 100 + edge + 1, y: 50 }, [point]);

      expect(ring.onPoint).toBe(false);
    });
  });

  describe('when the path has no points', () => {
    it('keeps the small ring', () => {
      expect(ringAt({ x: 0, y: 0 }).onPoint).toBe(false);
    });
  });
});
