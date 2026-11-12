import { describe, expect, it } from 'vitest';
import { periodOf } from 'world-of-evolving-paths';
import { makePath, makePoint } from '../../tests/fixtures';
import { minImportanceOf } from './levels';
import { buildPeriodData } from './periodData';
import { canComplete } from './rules';
import { connectProblem, DEFAULT_SEED, type DemoState, initialState, nextPointProblem, reduce } from './state';

const base = (): DemoState =>
  initialState(
    [makePath('combat')],
    [makePoint({ id: 'a', status: 'done', next: ['b'] }), makePoint({ id: 'b', status: 'open' })],
  );

describe('Demo app state', () => {
  describe('when a point is moved', () => {
    it('remembers the height of the dragged point on the level of the view, and only that one', () => {
      const state = reduce(base(), { type: 'move', level: 'week', id: 'b', height: 4 });

      expect(state.heights).toEqual({ week: { b: 4 }, month: {}, year: {} });
    });

    it('keeps nothing in an overview', () => {
      const state = reduce(base(), { type: 'move', level: null, id: 'b', height: 4 });

      expect(state.heights).toEqual(base().heights);
    });

    it('leaves the points after it where they are, with the heights they had', () => {
      const state = reduce(base(), { type: 'move', level: 'month', id: 'a', height: 50, followers: { b: 12 } });

      expect(state.heights.month).toEqual({ a: 50, b: 12 });
    });

    it('lets that height reach the data of a view of the same level, without a place on the time axis', () => {
      const moved = reduce(base(), { type: 'move', level: 'week', id: 'b', height: 321 });
      const period = periodOf('week', '2026-11-04');

      const { data } = buildPeriodData({
        paths: moved.paths,
        points: moved.points,
        checkIns: [],
        period,
        page: 0,
        heights: moved.heights.week,
      });

      const point = data.paths[0].points.find((candidate) => candidate.id === 'b');
      expect(point?.y).toBe(321);
      expect(point?.x).toBeUndefined();
    });
  });

  describe('when a whole path is moved', () => {
    it('remembers the heights of its points and of its line ends on that level', () => {
      const state = reduce(base(), {
        type: 'shiftPath',
        level: 'week',
        heights: { a: 5, b: -7 },
        boundaries: { 'a>x@10': 33 },
      });

      expect(state.heights.week).toEqual({ a: 5, b: -7 });
      expect(state.boundaryHeights.week).toEqual({ 'a>x@10': 33 });
      expect(state.heights.month).toEqual({});
    });

    it('keeps nothing in an overview', () => {
      const state = reduce(base(), { type: 'shiftPath', level: null, heights: { a: 5 }, boundaries: { 'a>x@10': 33 } });

      expect(state).toEqual(base());
    });

    it('lets the period before a border and the period after it show the same height', () => {
      const points = [
        makePoint({ id: 'early', date: '2026-11-03', next: ['late'] }),
        makePoint({ id: 'late', date: '2026-11-12' }),
      ];
      const first = periodOf('week', '2026-11-04');
      const second = periodOf('week', '2026-11-11');
      // The border between them lies after the last day of the first week
      const boundaries = { [`early@${first.end}#0`]: 77 };
      const request = { paths: [makePath('combat')], points, checkIns: [], page: 0, boundaryHeights: boundaries };

      const leaving = buildPeriodData({ ...request, period: first }).data.paths[0].points[0].outgoing?.[0].y;
      const entering = buildPeriodData({ ...request, period: second }).data.paths[0].points[0].incoming?.[0].y;

      expect(leaving).toBe(77);
      expect(entering).toBe(77);
    });
  });

  describe('when the arrow at the end of a line is dragged', () => {
    it('remembers the height at that border on that level only', () => {
      const state = reduce(base(), { type: 'boundaryHeight', level: 'week', key: 'a>b@5', height: -40 });

      expect(state.boundaryHeights).toEqual({ week: { 'a>b@5': -40 }, month: {}, year: {} });
    });
  });

  describe('when a line across the whole period has heights at its borders', () => {
    it('runs from the height where it comes in to the height where it leaves', () => {
      const points = [
        makePoint({ id: 'out', date: '2026-10-01', importance: 3, next: ['in'] }),
        makePoint({ id: 'in', date: '2026-11-20', importance: 3, next: ['far'] }),
        makePoint({ id: 'far', date: '2026-12-28', importance: 3 }),
        makePoint({ id: 'mid', pathId: 'other', date: '2026-10-05', importance: 3, next: ['end'] }),
        makePoint({ id: 'end', pathId: 'other', date: '2026-12-20', importance: 3 }),
      ];
      const month = periodOf('month', '2026-11-11');

      const { data } = buildPeriodData({
        paths: [makePath('combat'), makePath('other')],
        points,
        checkIns: [],
        period: month,
        page: 0,
        boundaryHeights: { [`mid@${month.start - 1}#0`]: 45, [`mid@${month.end}#0`]: -20 },
      });

      const other = data.paths.find((path) => path.id === 'other');
      expect(other?.through?.[0]).toMatchObject({ yStart: 45, yEnd: -20 });
    });

    it('keeps the lines of a fork apart, each with the height of its own branch', () => {
      const fork = [
        makePoint({ id: 'a', date: '2026-11-10', importance: 3, next: ['b', 'c'] }),
        makePoint({ id: 'b', date: '2026-12-20', importance: 3 }),
        makePoint({ id: 'c', date: '2026-12-22', importance: 3 }),
      ];
      const month = periodOf('month', '2026-11-11');

      const { data } = buildPeriodData({
        paths: [makePath('combat')],
        points: fork,
        checkIns: [],
        period: month,
        page: 0,
        boundaryHeights: { [`a@${month.end}#0`]: 30, [`a@${month.end}#1`]: -60 },
      });

      expect(data.paths[0].points[0].outgoing?.map((line) => line.y)).toEqual([30, -60]);
    });

    it('works out both heights from its two points when they are nearly level and none are kept', () => {
      const points = [
        makePoint({ id: 'mid', date: '2026-10-05', importance: 3, next: ['end'] }),
        makePoint({ id: 'end', date: '2026-12-20', importance: 3 }),
      ];
      const month = periodOf('month', '2026-11-11');

      const { data } = buildPeriodData({
        paths: [makePath('combat')],
        points,
        checkIns: [],
        period: month,
        page: 0,
        heights: { mid: 0, end: 30 },
      });

      const [line] = data.paths[0].through ?? [];
      expect(line.yStart).toBeDefined();
      expect(line.yEnd).toBeGreaterThan(line.yStart ?? 0);
    });

    it('puts the edge of a period on the straight line between two points that are nearly level', () => {
      const points = [
        makePoint({ id: 'out', date: '2026-10-22', importance: 3, next: ['in'] }),
        makePoint({ id: 'in', date: '2026-11-11', importance: 3 }),
      ];
      const month = periodOf('month', '2026-11-11');

      const { data } = buildPeriodData({
        paths: [makePath('combat')],
        points,
        checkIns: [],
        period: month,
        page: 0,
        heights: { out: 0, in: 20 },
      });

      // The edge lies between 31 October and 1 November: 9.5 of the 20 days from 22 October to 11 November
      expect(data.paths[0].points[0].incoming?.[0].y).toBe(10);
    });

    it('takes the height on the straight line between the points, however far apart they are in height', () => {
      const points = [
        makePoint({ id: 'out', date: '2026-10-22', importance: 3, next: ['in'] }),
        makePoint({ id: 'in', date: '2026-11-11', importance: 3 }),
      ];

      const { data } = buildPeriodData({
        paths: [makePath('combat')],
        points,
        checkIns: [],
        period: periodOf('month', '2026-11-11'),
        page: 0,
        heights: { out: 0, in: 100 },
      });

      expect(data.paths[0].points[0].incoming?.[0].y).toBe(48);
    });

    it('works out the same height where one period ends and the next one begins', () => {
      const points = [
        makePoint({ id: 'early', date: '2026-11-03', next: ['late'] }),
        makePoint({ id: 'late', date: '2026-11-12' }),
      ];
      const request = { paths: [makePath('combat')], points, checkIns: [], page: 0, heights: { early: 0, late: 30 } };

      const leaving = buildPeriodData({ ...request, period: periodOf('week', '2026-11-04') }).data.paths[0].points[0]
        .outgoing?.[0].y;
      const entering = buildPeriodData({ ...request, period: periodOf('week', '2026-11-11') }).data.paths[0].points[0]
        .incoming?.[0].y;

      expect(leaving).toBeDefined();
      expect(entering).toBe(leaving);
    });
  });

  describe('when a point is inserted into a line', () => {
    const chain = (): DemoState =>
      initialState(
        [makePath('combat')],
        [
          makePoint({ id: 'a', date: '2026-11-02', status: 'done', next: ['hidden'] }),
          makePoint({ id: 'hidden', date: '2026-11-10', next: ['b'], importance: 1 }),
          makePoint({ id: 'b', date: '2026-11-20' }),
        ],
      );
    const direct = (): DemoState =>
      initialState(
        [makePath('combat')],
        [
          makePoint({ id: 'a', date: '2026-11-02', status: 'done', next: ['b'] }),
          makePoint({ id: 'b', date: '2026-11-20' }),
        ],
      );
    const insert = (state: DemoState, date: string) =>
      reduce(state, { type: 'insert', level: 'week', fromId: 'a', toId: 'b', height: 40, date, importance: 2 });

    it('leads from the start of the line to the new point and on to what the line led to', () => {
      const state = insert(direct(), '2026-11-05');

      const created = state.points.find((point) => point.id === 'custom-1');
      expect(state.points.find((point) => point.id === 'a')?.next).toEqual(['custom-1']);
      expect(created?.next).toEqual(['b']);
    });

    it('goes in before the first hidden point when the line runs across hidden points', () => {
      const state = insert(chain(), '2026-11-15');

      expect(state.points.find((point) => point.id === 'a')?.next).toEqual(['custom-1']);
      expect(state.points.find((point) => point.id === 'custom-1')?.next).toEqual(['hidden']);
    });

    it('takes the date of the click, but keeps it between the points of the line', () => {
      expect(insert(direct(), '2026-11-05').points.find((point) => point.id === 'custom-1')?.date).toBe('2026-11-05');
      expect(insert(chain(), '2026-11-15').points.find((point) => point.id === 'custom-1')?.date).toBe('2026-11-10');
      expect(insert(direct(), '2026-10-01').points.find((point) => point.id === 'custom-1')?.date).toBe('2026-11-02');
    });

    it('sits on the path of the line, at the height where the user clicked, and keeps that height', () => {
      const state = insert(direct(), '2026-11-05');

      expect(state.points.find((point) => point.id === 'custom-1')?.pathId).toBe('combat');
      expect(state.heights.week['custom-1']).toBe(40);
    });

    it('does nothing when the two points are not connected', () => {
      const state = reduce(base(), {
        type: 'insert',
        level: 'week',
        fromId: 'b',
        toId: 'a',
        height: 0,
        date: '2026-11-05',
        importance: 2,
      });

      expect(state).toEqual(base());
    });
  });

  describe('when a point is added by double-click', () => {
    it('creates an open milestone at the height where the user clicked', () => {
      const state = reduce(base(), {
        type: 'add',
        level: 'week',
        pathId: 'combat',
        height: 20,
        date: '2026-11-09',
        importance: 1,
      });

      const added = state.points.find((point) => point.id === 'custom-1');
      expect(added).toMatchObject({ kind: 'milestone', status: 'open', date: '2026-11-09' });
      expect(state.heights.week['custom-1']).toBe(20);
    });

    it('keeps no height in an overview, so the layout places it', () => {
      const state = reduce(base(), {
        type: 'add',
        level: null,
        pathId: 'combat',
        height: 20,
        date: '2026-11-09',
        importance: 1,
      });

      expect(state.heights).toEqual(base().heights);
    });

    it('is as important as the view needs, so the view still shows it', () => {
      const year = periodOf('year', '2026-07-02');
      const state = reduce(base(), {
        type: 'add',
        level: 'year',
        pathId: 'combat',
        height: 20,
        date: '2026-07-02',
        importance: minImportanceOf(year),
      });

      const { data } = buildPeriodData({
        paths: state.paths,
        points: state.points,
        checkIns: [],
        period: year,
        page: 0,
      });

      const shownIds = data.paths.flatMap((path) => path.points.map((point) => point.id));
      expect(shownIds).toContain('custom-1');
    });
  });

  describe('when two points are connected', () => {
    const chain = (): DemoState =>
      initialState(
        [makePath('combat')],
        [
          makePoint({ id: 'a', next: ['b'] }),
          makePoint({ id: 'b', next: ['c'] }),
          makePoint({ id: 'c' }),
          makePoint({ id: 'd' }),
        ],
      );

    it('adds the target to the connections of the first point', () => {
      const state = reduce(chain(), { type: 'connect', fromId: 'a', toId: 'd' });

      expect(state.points.find((point) => point.id === 'a')?.next).toEqual(['b', 'd']);
    });

    it('refuses a point to itself, a known connection and a circle', () => {
      const { points } = chain();

      expect(connectProblem(points, 'a', 'a')).not.toBeNull();
      expect(connectProblem(points, 'a', 'b')).not.toBeNull();
      expect(connectProblem(points, 'c', 'a')).not.toBeNull();
      expect(connectProblem(points, 'a', 'd')).toBeNull();
    });

    it('refuses a point that does not exist', () => {
      const { points } = chain();

      expect(connectProblem(points, 'a', 'missing')).not.toBeNull();
    });

    it('leaves the state alone when the connection is refused', () => {
      const before = chain();

      expect(reduce(before, { type: 'connect', fromId: 'c', toId: 'a' })).toBe(before);
    });
  });

  describe('when a next point is added', () => {
    it('connects it to the point it follows', () => {
      const input = { title: 'Next', date: '2026-11-10', newPath: false, color: '#ffffff', pathName: '' };

      const state = reduce(base(), { type: 'addNext', fromId: 'b', input });

      expect(state.points.find((point) => point.id === 'b')?.next).toEqual(['custom-1']);
    });

    it('creates a new path when asked to', () => {
      const input = { title: 'Side quest', date: '2026-11-10', newPath: true, color: '#123456', pathName: '' };

      const state = reduce(base(), { type: 'addNext', fromId: 'b', input });

      expect(state.paths).toHaveLength(2);
      expect(state.points.find((point) => point.id === 'custom-1')?.pathId).toBe('custom-path-1');
    });

    it('names the new path as asked, so the name is not lost with the first point', () => {
      const input = { title: 'Side quest', date: '2026-11-10', newPath: true, color: '#123456', pathName: 'Dungeons' };

      const state = reduce(base(), { type: 'addNext', fromId: 'b', input });

      expect(state.paths.at(-1)?.name).toBe('Dungeons');
    });

    it('takes the title when the input has no path name at all', () => {
      const input = { title: 'Side quest', date: '2026-11-10', newPath: true, color: '#123456' };

      const state = reduce(base(), { type: 'addNext', fromId: 'b', input });

      expect(state.paths.at(-1)?.name).toBe('Side quest');
    });

    it('uses the name of the point when the path has no name', () => {
      const input = { title: 'Side quest', date: '2026-11-10', newPath: true, color: '#123456', pathName: '  ' };

      const state = reduce(base(), { type: 'addNext', fromId: 'b', input });

      expect(state.paths.at(-1)?.name).toBe('Side quest');
    });

    it('rejects an empty name and a bad date', () => {
      expect(
        nextPointProblem({ title: ' ', date: '2026-11-10', newPath: false, color: '#fff', pathName: '' }),
      ).toContain('name');
      expect(
        nextPointProblem({ title: 'x', date: '10.11.2026', newPath: false, color: '#fff', pathName: '' }),
      ).toContain('date');
    });
  });

  describe('when a point is deleted', () => {
    it('removes it and the links that led to it', () => {
      const state = reduce(base(), { type: 'delete', id: 'b' });

      expect(state.points.map((point) => point.id)).toEqual(['a']);
      expect(state.points[0].next).toEqual([]);
    });

    it('closes the gap in a line: what led to it now leads to what it led to', () => {
      const line = initialState(
        [makePath('combat')],
        [
          makePoint({ id: 'a', date: '2026-11-02', next: ['x'] }),
          makePoint({ id: 'x', date: '2026-11-10', next: ['b'] }),
          makePoint({ id: 'b', date: '2026-11-20' }),
        ],
      );

      const state = reduce(line, { type: 'delete', id: 'x' });

      expect(state.points.map((point) => point.id)).toEqual(['a', 'b']);
      expect(state.points[0].next).toEqual(['b']);
    });

    it('keeps a fork whole and links nothing twice', () => {
      const fork = initialState(
        [makePath('combat')],
        [
          makePoint({ id: 'a', date: '2026-11-02', next: ['x', 'b'] }),
          makePoint({ id: 'x', date: '2026-11-10', next: ['b', 'c'] }),
          makePoint({ id: 'b', date: '2026-11-20' }),
          makePoint({ id: 'c', date: '2026-11-22' }),
        ],
      );

      const state = reduce(fork, { type: 'delete', id: 'x' });

      expect(state.points[0].next).toEqual(['b', 'c']);
    });

    it('forgets the height that was chosen for it, on every level', () => {
      const week = reduce(base(), { type: 'move', level: 'week', id: 'b', height: 9 });
      const moved = reduce(week, { type: 'move', level: 'year', id: 'b', height: 3 });

      expect(reduce(moved, { type: 'delete', id: 'b' }).heights).toEqual(base().heights);
    });

    it('forgets the heights at the borders of the lines that led to it or from it, on every level', () => {
      const shifted = reduce(base(), {
        type: 'shiftPath',
        level: 'month',
        heights: {},
        boundaries: { 'b@5#0': 1, 'c@5#0': 2 },
      });

      expect(reduce(shifted, { type: 'delete', id: 'b' }).boundaryHeights.month).toEqual({ 'c@5#0': 2 });
    });
  });

  describe('when the layout is rerolled', () => {
    it('moves to the next seed', () => {
      const state = reduce(base(), { type: 'reroll', level: 'week', viewKey: 'v', pointIds: [] });

      expect(state.seeds.v).toBe(DEFAULT_SEED + 1);
    });

    it('lets go of the heights of the points of that view on its level, and keeps the others', () => {
      const first = reduce(base(), { type: 'move', level: 'week', id: 'a', height: 1 });
      const second = reduce(first, { type: 'move', level: 'week', id: 'b', height: 2 });
      const moved = reduce(second, { type: 'move', level: 'month', id: 'a', height: 3 });

      const state = reduce(moved, { type: 'reroll', level: 'week', viewKey: 'v', pointIds: ['a'] });

      expect(state.heights).toEqual({ week: { b: 2 }, month: { a: 3 }, year: {} });
    });
  });

  describe('when checking in on a path', () => {
    it('remembers the day', () => {
      const state = reduce(base(), { type: 'checkIn', pathId: 'combat', date: '2026-11-07' });

      expect(state.checkIns).toEqual([{ pathId: 'combat', date: '2026-11-07' }]);
    });

    it('counts a second check-in on the same day only once', () => {
      const once = reduce(base(), { type: 'checkIn', pathId: 'combat', date: '2026-11-07' });

      const twice = reduce(once, { type: 'checkIn', pathId: 'combat', date: '2026-11-07' });

      expect(twice.checkIns).toHaveLength(1);
    });
  });

  describe('when a next point is added to an important point', () => {
    it('is as important, so it shows in the same views', () => {
      const important = initialState([makePath('combat')], [makePoint({ id: 'a', importance: 4 })]);
      const input = { title: 'Next', date: '2026-11-10', newPath: false, color: '#ffffff', pathName: '' };

      const state = reduce(important, { type: 'addNext', fromId: 'a', input });

      expect(state.points.find((point) => point.id === 'custom-1')?.importance).toBe(4);
    });
  });
  describe('when asking whether a point can be completed', () => {
    it('allows it once all earlier points are done', () => {
      expect(canComplete(base().points, 'b')).toBe(true);
    });

    it('waits while an earlier point is still open', () => {
      const points = [makePoint({ id: 'a', status: 'open', next: ['b'] }), makePoint({ id: 'b' })];

      expect(canComplete(points, 'b')).toBe(false);
    });
  });
});
