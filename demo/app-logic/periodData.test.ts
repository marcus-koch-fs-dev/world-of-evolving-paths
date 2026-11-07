import { describe, expect, it } from 'vitest';
import { periodOf } from 'world-of-evolving-paths';
import { makePath, makePoint } from '../../tests/fixtures';
import { buildPeriodData, importanceOf, pagesOf, visiblePoints, withStrength } from './periodData';
import type { DemoPoint } from './types';

const week = periodOf('week', '2026-11-04');

describe('Period data for the demo', () => {
  describe('when rating importance', () => {
    it('counts start and goal as at least 3', () => {
      expect(importanceOf({ kind: 'start', importance: 1 })).toBe(3);
      expect(importanceOf({ kind: 'goal' })).toBe(3);
    });

    it('keeps a higher importance of a start', () => {
      expect(importanceOf({ kind: 'start', importance: 5 })).toBe(5);
    });
  });

  describe('when splitting paths into pages', () => {
    it('keeps a whole path on one page', () => {
      expect(pagesOf(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
    });
  });

  describe('when choosing the points of a view', () => {
    const chain: DemoPoint[] = [
      makePoint({ id: 'a', date: '2026-11-02', importance: 2, next: ['b'] }),
      makePoint({ id: 'b', date: '2026-11-03', importance: 1, next: ['c'] }),
      makePoint({ id: 'c', date: '2026-11-05', importance: 2, next: ['d'] }),
      makePoint({ id: 'd', date: '2026-12-25', importance: 2 }),
    ];

    it('leaves out points outside the period and the less important ones', () => {
      const shown = visiblePoints(chain, week, 2);

      expect(shown.map((point) => point.id)).toEqual(['a', 'c']);
    });

    it('runs a connection across a hidden point to the next visible one', () => {
      const shown = visiblePoints(chain, week, 2);

      expect(shown[0].next).toEqual(['c']);
    });

    it('links only to points the view shows', () => {
      const shown = visiblePoints(chain, week, 2);

      expect(shown[1].next).toEqual([]);
    });

    it('shows everything without a period', () => {
      expect(visiblePoints(chain, null, 1)).toHaveLength(4);
    });
  });

  describe('when computing the strength of a path', () => {
    it('counts reached points that the view hides', () => {
      const daily = Array.from({ length: 20 }, (_, i) =>
        makePoint({ id: `p${i}`, date: `2026-10-${String(10 + i).padStart(2, '0')}`, status: 'done', importance: 1 }),
      );
      const last = makePoint({ id: 'last', date: '2026-10-30', status: 'done', importance: 3 });
      const all = [...daily, last];

      const [shown] = withStrength([last], all);

      expect(shown.strength).toBeGreaterThanOrEqual(3);
    });

    it('leaves open points without a strength', () => {
      const open = makePoint({ id: 'open', status: 'open' });

      expect(withStrength([open], [open])[0].strength).toBeUndefined();
    });
  });

  describe('when building the data for a view', () => {
    const paths = [makePath('a', '#ff0000', 0), makePath('b', '#00ff00', 1), makePath('c', '#0000ff', 2)];
    const points = [
      makePoint({ id: 'a1', pathId: 'a', date: '2026-11-03' }),
      makePoint({ id: 'b1', pathId: 'b', date: '2026-11-04' }),
      makePoint({ id: 'c1', pathId: 'c', date: '2026-11-05' }),
    ];

    it('uses only the paths that have points in the view', () => {
      const result = buildPeriodData({ paths, points: points.slice(0, 1), period: week, page: 0, pins: {} });

      expect(result.data.paths.map((path) => path.id)).toEqual(['a']);
    });

    it('splits paths over pages of the level', () => {
      const first = buildPeriodData({
        paths: [...paths, makePath('d')],
        points: [...points, makePoint({ id: 'd1', pathId: 'd', date: '2026-11-06' })],
        period: week,
        page: 0,
        pins: {},
      });
      const second = buildPeriodData({
        paths: [...paths, makePath('d')],
        points: [...points, makePoint({ id: 'd1', pathId: 'd', date: '2026-11-06' })],
        period: week,
        page: 1,
        pins: {},
      });

      expect(first.pages).toBe(2);
      expect(first.data.paths).toHaveLength(3);
      expect(second.data.paths.map((path) => path.id)).toEqual(['d']);
    });

    it('keeps the page inside the range', () => {
      const result = buildPeriodData({ paths, points, period: week, page: 99, pins: {} });

      expect(result.page).toBe(result.pages - 1);
    });

    it('pins points at the positions the user chose', () => {
      const result = buildPeriodData({ paths, points, period: week, page: 0, pins: { a1: { x: 5, y: 6 } } });

      expect(result.data.paths.flatMap((path) => path.points).find((point) => point.id === 'a1')).toMatchObject({
        x: 5,
        y: 6,
      });
    });
  });
});
