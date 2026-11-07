import { describe, expect, it } from 'vitest';
import { collisionRadius, isFreeAt, type Layout, nearestFree, settle } from './collision.js';

const mover = { id: 'self', kind: 'milestone' as const };
const body = (id: string, x: number, y: number) => ({ id, x, y, kind: 'milestone' as const });

describe('Collision', () => {
  describe('when computing the radius', () => {
    it('is bigger for a goal than for a milestone', () => {
      expect(collisionRadius({ kind: 'goal' })).toBeGreaterThan(collisionRadius({ kind: 'milestone' }));
    });

    it('grows with importance', () => {
      expect(collisionRadius({ kind: 'milestone', importance: 3 })).toBeGreaterThan(
        collisionRadius({ kind: 'milestone' }),
      );
    });
  });

  describe('when two points are close', () => {
    const layout: Layout = { bodies: [body('other', 0, 0)], links: [] };

    it('is not free closer than radius plus radius', () => {
      const tooClose = collisionRadius(mover) * 2 - 1;

      expect(isFreeAt(layout, mover, { x: tooClose, y: 0 })).toBe(false);
    });

    it('is free at exactly radius plus radius', () => {
      const distance = collisionRadius(mover) * 2;

      expect(isFreeAt(layout, mover, { x: distance, y: 0 })).toBe(true);
    });

    it('finds the nearest free spot outside both radii', () => {
      const spot = nearestFree(layout, mover, { x: 10, y: 0 });

      expect(Math.hypot(spot.x, spot.y)).toBeGreaterThanOrEqual(collisionRadius(mover) * 2 - 0.01);
    });

    it('returns the same spot when it is already free', () => {
      const wanted = { x: 500, y: 500 };

      expect(nearestFree(layout, mover, wanted)).toBe(wanted);
    });
  });

  describe('when a line runs between two points', () => {
    const layout: Layout = {
      bodies: [body('a', 0, 0), body('b', 400, 0)],
      links: [{ from: 'a', to: 'b' }],
    };

    it('keeps a point off a foreign line', () => {
      expect(isFreeAt(layout, mover, { x: 200, y: 0 })).toBe(false);
    });

    it('allows a point away from the line', () => {
      expect(isFreeAt(layout, mover, { x: 200, y: 200 })).toBe(true);
    });
  });

  describe('when a point has its own line', () => {
    const layout: Layout = {
      bodies: [body('self', 0, 300), body('neighbour', 400, 300), body('blocker', 200, 300)],
      links: [{ from: 'self', to: 'neighbour' }],
    };

    it('may not touch another point with that line', () => {
      expect(isFreeAt(layout, mover, { x: 0, y: 300 })).toBe(false);
    });
  });

  describe('when releasing a dragged point', () => {
    const layout: Layout = { bodies: [body('self', 0, 200), body('blocker', 400, 200)], links: [] };

    it('puts it exactly at the target when free', () => {
      const target = { x: 200, y: 600 };

      expect(settle(layout, mover, { x: 0, y: 200 }, target)).toBe(target);
    });

    it('springs back along the way when the target is taken', () => {
      const start = { x: 0, y: 200 };
      const target = { x: 400, y: 200 };

      const result = settle(layout, mover, start, target);

      expect(result.x).toBeGreaterThan(0);
      expect(result.x).toBeLessThan(400);
      expect(isFreeAt(layout, mover, result)).toBe(true);
    });
  });
});
