import { describe, expect, it } from 'vitest';
import { editPoint, makePath, makePeriodData, makePoint } from '../../tests/fixtures';
import { periodOf } from './calendar';
import { collisionRadius } from './collision';
import { toDay } from './dates';
import { flattenPeriod } from './flatten';
import { dateAtX, dayAtX, generateLayout, placePeriod, tileWidth } from './layout';

const week = periodOf('week', '2026-11-04');
const WEEK_KEY = week.key;

function layoutOf(seed: number) {
  const flat = flattenPeriod(makePeriodData());
  return generateLayout({ paths: flat.paths, points: flat.points, period: week, seed });
}

describe('Layout', () => {
  describe('when generating', () => {
    it('gives the same result for the same input and seed', () => {
      expect(layoutOf(1).positions).toEqual(layoutOf(1).positions);
    });

    it('gives a different result for another seed', () => {
      expect(layoutOf(1).positions).not.toEqual(layoutOf(2).positions);
    });

    it('places every point', () => {
      const flat = flattenPeriod(makePeriodData());

      const { positions } = layoutOf(1);

      expect(Object.keys(positions).sort()).toEqual(flat.points.map((point) => point.id).sort());
    });

    it('keeps radius plus radius between all points', () => {
      const { positions } = layoutOf(1);

      const ids = flattenPeriod(makePeriodData()).points.map((point) => point.id);
      for (const a of ids) {
        for (const b of ids.filter((id) => id > a)) {
          const distance = Math.hypot(positions[a].x - positions[b].x, positions[a].y - positions[b].y);
          expect(distance).toBeGreaterThanOrEqual(collisionRadius({ kind: 'milestone' }) * 2 - 0.5);
        }
      }
    });

    it('puts earlier dates further left on the same path', () => {
      const { positions } = layoutOf(1);

      expect(positions.c1.x).toBeLessThan(positions.c2.x);
      expect(positions.c2.x).toBeLessThan(positions.c3.x);
    });

    it('keeps the points inside the width of the tile', () => {
      const { positions, width } = layoutOf(1);

      for (const position of Object.values(positions)) {
        expect(position.x).toBeGreaterThanOrEqual(0);
        expect(position.x).toBeLessThanOrEqual(width);
      }
    });
  });

  describe('when a point is pinned', () => {
    it('stays exactly where it is', () => {
      const flat = flattenPeriod(editPoint(makePeriodData(), 'c2', { x: 1234, y: -567 }));

      const { positions } = generateLayout({ paths: flat.paths, points: flat.points, period: week, seed: 1 });

      expect(positions.c2).toEqual({ x: 1234, y: -567 });
    });
  });

  describe('when a fork has several branches', () => {
    it('pushes the branches apart sideways', () => {
      const points = [
        makePoint({ id: 'fork', kind: 'crossroad', date: '2026-11-02', next: ['a', 'b'] }),
        makePoint({ id: 'a', date: '2026-11-05' }),
        makePoint({ id: 'b', date: '2026-11-05' }),
      ];

      const { positions } = generateLayout({ paths: [makePath('combat')], points, period: week, seed: 1 });

      expect(Math.abs(positions.a.y - positions.b.y)).toBeGreaterThan(100);
    });
  });

  describe('when the tile grows', () => {
    it('is never narrower than the minimum', () => {
      expect(tileWidth([makePoint({ id: 'one' })])).toBe(1400);
    });

    it('widens with the busiest path', () => {
      const many = Array.from({ length: 20 }, (_, i) => makePoint({ id: `p${i}` }));

      expect(tileWidth(many)).toBe(20 * 140);
    });
  });

  describe('when placing a period', () => {
    it('drops links to points that do not exist', () => {
      const data = editPoint(makePeriodData(), 'c3', { next: ['ghost'] });

      const world = placePeriod(data, WEEK_KEY, '2026-11-07', 1);

      expect(world.points.find((point) => point.id === 'c3')?.next).toEqual([]);
    });

    it('works for a view that is not a calendar period', () => {
      const world = placePeriod(makePeriodData(), 'free', '2026-11-07', 1);

      expect(world.points).toHaveLength(5);
    });
  });

  describe('when turning a position into a date', () => {
    it('stays inside the period at both ends', () => {
      expect(dayAtX(-500, week, 1400)).toBe(week.start);
      expect(dayAtX(99999, week, 1400)).toBe(week.end);
    });

    it('gives a date in the middle of the tile for the middle position', () => {
      const date = dateAtX(700, makePeriodData(), WEEK_KEY, '2026-11-07');

      expect(toDay(date)).toBeGreaterThan(week.start);
      expect(toDay(date)).toBeLessThan(week.end);
    });

    it('gives today in a view without calendar', () => {
      expect(dateAtX(700, makePeriodData(), 'free', '2026-11-07')).toBe('2026-11-07');
    });
  });
});
