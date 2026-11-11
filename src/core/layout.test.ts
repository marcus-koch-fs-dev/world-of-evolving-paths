import { describe, expect, it } from 'vitest';
import { editPoint, makePath, makePeriodData, makePoint } from '../../tests/fixtures.js';
import { periodOf } from './calendar.js';
import { collisionRadius } from './collision.js';
import { toDay } from './dates.js';
import { flattenPeriod } from './flatten.js';
import { generateLayout, laneOffsets, placePeriod } from './layout.js';
import { dateAtX, dayAtX, tileWidth } from './timeAxis.js';

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
      const pairs = ids.flatMap((a, i) => ids.slice(i + 1).map((b) => [a, b]));
      pairs.forEach(([a, b]) => {
        const distance = Math.hypot(positions[a].x - positions[b].x, positions[a].y - positions[b].y);
        expect(distance).toBeGreaterThanOrEqual(collisionRadius({ kind: 'milestone' }) * 2 - 0.5);
      });
    });

    it('puts earlier dates further left on the same path', () => {
      const { positions } = layoutOf(1);

      expect(positions.c1.x).toBeLessThan(positions.c2.x);
      expect(positions.c2.x).toBeLessThan(positions.c3.x);
    });

    it('keeps the points inside the width of the tile', () => {
      const { positions, width } = layoutOf(1);

      Object.values(positions).forEach((position) => {
        expect(position.x).toBeGreaterThanOrEqual(0);
        expect(position.x).toBeLessThanOrEqual(width);
      });
    });
  });

  describe('when a point is pinned', () => {
    it('stays exactly where it is', () => {
      const flat = flattenPeriod(editPoint(makePeriodData(), 'c2', { x: 1234, y: -567 }));

      const { positions } = generateLayout({ paths: flat.paths, points: flat.points, period: week, seed: 1 });

      expect(positions.c2).toEqual({ x: 1234, y: -567 });
    });

    it('keeps only its height when there is only a y, and sits on its date', () => {
      const plain = flattenPeriod(makePeriodData());
      const heightOnly = flattenPeriod(editPoint(makePeriodData(), 'c2', { y: -567 }));

      const free = generateLayout({ paths: plain.paths, points: plain.points, period: week, seed: 1 });
      const kept = generateLayout({ paths: heightOnly.paths, points: heightOnly.points, period: week, seed: 1 });

      const pathId = heightOnly.points.find((point) => point.id === 'c2')?.pathId ?? '';
      expect(kept.positions.c2.y).toBe((laneOffsets(heightOnly.paths).get(pathId) ?? 0) - 567);
      expect(kept.positions.c2.x).toBeGreaterThan(free.positions.c1.x);
    });

    it('keeps the same distance from its lane however many paths the view has', () => {
      const point = makePoint({ id: 'p', pathId: 'b', date: '2026-11-04', y: 30 });
      const path = (id: string, lane: number) => ({ id, name: id, color: '#ff0000', lane });
      const two = [path('a', 0), path('b', 1)];
      const six = [...two, path('c', 2), path('d', 3), path('e', 4), path('f', 5)];

      const inTwo = generateLayout({ paths: two, points: [point], period: week, seed: 1 });
      const inSix = generateLayout({ paths: six, points: [point], period: week, seed: 1 });

      expect(inTwo.positions.p.y - (laneOffsets(two).get('b') ?? 0)).toBe(30);
      expect(inSix.positions.p.y - (laneOffsets(six).get('b') ?? 0)).toBe(30);
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
      expect(tileWidth([makePoint({ id: 'one' })])).toBe(2200);
    });

    it('widens with the busiest path', () => {
      const many = Array.from({ length: 20 }, (_, i) => makePoint({ id: `p${i}` }));

      expect(tileWidth(many)).toBe(20 * 200);
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
