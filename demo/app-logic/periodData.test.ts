import { describe, expect, it } from 'vitest';
import { fromDay, periodOf, toDay } from 'world-of-evolving-paths';
import { makePath, makePoint } from '../../tests/fixtures';
import { LEVEL_SETTINGS } from './levels';
import { buildPeriodData, importanceOf, pagesOf, visiblePoints, withStatusAsOf, withStrength } from './periodData';
import type { CheckIn, DemoPoint } from './types';

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
    const daily = (pathId: string, from: number, count: number): CheckIn[] =>
      Array.from({ length: count }, (_, i) => ({ pathId, date: fromDay(from + i) }));

    it('grows with the check-ins on the path up to the date of the point', () => {
      const point = makePoint({ id: 'p', date: fromDay(toDay('2026-11-04')), status: 'done' });
      const checkIns = daily('combat', toDay('2026-11-04') - 59, 60);

      const [shown] = withStrength([point], checkIns);

      expect(shown.strength).toBe(3);
    });

    it('does not count check-ins on other paths or after the date', () => {
      const point = makePoint({ id: 'p', date: '2026-11-04', status: 'done' });
      const checkIns = [...daily('other', toDay('2026-09-01'), 60), ...daily('combat', toDay('2026-11-05'), 60)];

      const [shown] = withStrength([point], checkIns);

      expect(shown.strength).toBe(0);
    });

    it('counts the point being walked to on the day of the time travel, not on its own date', () => {
      const ahead = makePoint({ id: 'p', date: '2027-06-01', status: 'current' });
      const checkIns = daily('combat', toDay('2026-11-02') - 19, 20);

      expect(withStrength([ahead], checkIns, '2026-11-02')[0].strength).toBe(2);
      expect(withStrength([ahead], checkIns)[0].strength).toBe(0);
    });

    it('leaves open points without a strength', () => {
      const open = makePoint({ id: 'open', status: 'open' });

      expect(withStrength([open], [])[0].strength).toBeUndefined();
    });
  });

  describe('when moving through time', () => {
    const chain = [
      makePoint({ id: 'a', date: '2026-11-02', status: 'open' }),
      makePoint({ id: 'b', date: '2026-11-05', status: 'open' }),
      makePoint({ id: 'c', date: '2026-11-09', status: 'open' }),
      makePoint({ id: 'x', date: '2026-11-01', status: 'abandoned' }),
    ];

    it('makes earlier points done and the next one on the path current', () => {
      const result = withStatusAsOf(chain, '2026-11-04');

      expect(result.map((point) => [point.id, point.status])).toEqual([
        ['a', 'done'],
        ['b', 'current'],
        ['c', 'open'],
        ['x', 'abandoned'],
      ]);
    });

    it('turns everything done after the last point', () => {
      const result = withStatusAsOf(chain, '2026-12-01');

      expect(result.filter((point) => point.status === 'done')).toHaveLength(3);
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
      const result = buildPeriodData({
        paths,
        points: points.slice(0, 1),
        period: week,
        page: 0,
        checkIns: [],
      });

      expect(result.data.paths.map((path) => path.id)).toEqual(['a']);
    });

    it('splits paths over pages of the level', () => {
      const first = buildPeriodData({
        paths: [...paths, makePath('d')],
        points: [...points, makePoint({ id: 'd1', pathId: 'd', date: '2026-11-06' })],
        period: week,
        page: 0,
        checkIns: [],
      });
      const second = buildPeriodData({
        paths: [...paths, makePath('d')],
        points: [...points, makePoint({ id: 'd1', pathId: 'd', date: '2026-11-06' })],
        period: week,
        page: 1,
        checkIns: [],
      });

      const size = LEVEL_SETTINGS.week.graphsPerPage;
      expect(first.pages).toBe(Math.ceil(4 / size));
      expect(first.data.paths).toHaveLength(size);
      expect(second.data.paths.map((path) => path.id)).toEqual(['a', 'b', 'c', 'd'].slice(size, size * 2));
    });

    it('keeps the page inside the range', () => {
      const result = buildPeriodData({ paths, points, period: week, page: 99, checkIns: [] });

      expect(result.page).toBe(result.pages - 1);
    });

    it('keeps points at the height the user chose, and leaves their place on the time axis to the date', () => {
      const result = buildPeriodData({
        paths,
        points,
        period: week,
        page: 0,
        checkIns: [],
        heights: { a1: 6 },
      });

      const pinned = result.data.paths.flatMap((path) => path.points).find((point) => point.id === 'a1');
      expect(pinned?.y).toBe(6);
      expect(pinned?.x).toBeUndefined();
    });
  });
});

describe('Heights of the lines of a fork', () => {
  const month = periodOf('month', '2026-11-11');
  const fork = (dateOfSecond: string): DemoPoint[] => [
    makePoint({ id: 'a', date: '2026-11-10', importance: 3, next: ['b', 'c'] }),
    makePoint({ id: 'b', date: '2026-12-20', importance: 3 }),
    makePoint({ id: 'c', date: dateOfSecond, importance: 3 }),
  ];
  const outgoingOf = (points: DemoPoint[], heights: Record<string, number>) =>
    buildPeriodData({ paths: [makePath('combat')], points, checkIns: [], period: month, page: 0, heights }).data
      .paths[0].points[0].outgoing;

  it('leaves lines that would get the same height to the map, so it spreads them', () => {
    const lines = outgoingOf(fork('2026-12-20'), { a: 40 });

    expect(lines).toHaveLength(2);
    expect(lines?.map((line) => line.y)).toEqual([undefined, undefined]);
  });

  it('gives each line its own height when they differ', () => {
    const lines = outgoingOf(fork('2026-12-20'), { a: 40, b: 100, c: -100 });

    expect(lines?.map((line) => line.y)).toEqual([expect.any(Number), expect.any(Number)]);
    expect(lines?.[0].y).not.toBe(lines?.[1].y);
  });

  it('always keeps a height the user dragged a line to', () => {
    const lines = buildPeriodData({
      paths: [makePath('combat')],
      points: fork('2026-12-20'),
      checkIns: [],
      period: month,
      page: 0,
      heights: { a: 40 },
      edgeHeights: { 'a>b': 77, 'a>c': 77 },
    }).data.paths[0].points[0].outgoing;

    expect(lines?.map((line) => line.y)).toEqual([77, 77]);
  });
});
