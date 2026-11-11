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
    it('pins the heights of all points of that view, not their place on the time axis', () => {
      const positions = { a: { x: 1, y: 2 }, b: { x: 3, y: 4 } };

      const state = reduce(base(), { type: 'move', viewKey: 'week:p0', positions });

      expect(state.pins['week:p0']).toEqual({ a: { y: 2 }, b: { y: 4 } });
    });

    it('remembers the height of the dragged point for every view', () => {
      const positions = { a: { x: 1, y: 2 }, b: { x: 3, y: 4 } };

      const state = reduce(base(), { type: 'move', viewKey: 'week:p0', positions, id: 'b', y: 4 });

      expect(state.heights).toEqual({ b: 4 });
    });

    it('lets that height reach the data of another view', () => {
      const moved = reduce(base(), { type: 'move', viewKey: 'week:p0', positions: {}, id: 'b', y: 321 });
      const period = periodOf('week', '2026-11-04');

      const { data } = buildPeriodData({
        paths: moved.paths,
        points: moved.points,
        checkIns: [],
        period,
        page: 0,
        pins: {},
        heights: moved.heights,
      });

      const point = data.paths[0].points.find((candidate) => candidate.id === 'b');
      expect(point?.y).toBe(321);
      expect(point?.x).toBeUndefined();
    });
  });

  describe('when the end of a line is dragged', () => {
    it('remembers the height for that connection', () => {
      const state = reduce(base(), { type: 'lineHeight', fromId: 'a', toId: 'b', y: -150 });

      expect(state.lineHeights).toEqual({ 'a>b': -150 });
    });

    it('gives that height to the line in any view, as a lead and as a line across', () => {
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
        pins: {},
        lineHeights: { 'out>in': -90, 'mid>end': 45 },
      });

      const combat = data.paths.find((path) => path.id === 'combat');
      const other = data.paths.find((path) => path.id === 'other');
      expect(combat?.points[0].incoming?.[0].y).toBe(-90);
      expect(other?.through?.[0].y).toBe(45);
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
      reduce(state, {
        type: 'insert',
        viewKey: 'week:p0',
        fromId: 'a',
        toId: 'b',
        x: 500,
        y: 40,
        date,
        importance: 2,
      });

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
      expect(state.pins['week:p0']['custom-1']).toEqual({ y: 40 });
      expect(state.heights['custom-1']).toBe(40);
    });

    it('does nothing when the two points are not connected', () => {
      const state = reduce(base(), {
        type: 'insert',
        viewKey: 'v',
        fromId: 'b',
        toId: 'a',
        x: 0,
        y: 0,
        date: '2026-11-05',
        importance: 2,
      });

      expect(state).toEqual(base());
    });
  });

  describe('when a point is added by double-click', () => {
    it('creates an open milestone pinned where the user clicked', () => {
      const state = reduce(base(), {
        type: 'add',
        viewKey: 'v',
        pathId: 'combat',
        x: 10,
        y: 20,
        date: '2026-11-09',
        importance: 1,
      });

      const added = state.points.find((point) => point.id === 'custom-1');
      expect(added).toMatchObject({ kind: 'milestone', status: 'open', date: '2026-11-09' });
      expect(state.pins.v['custom-1']).toEqual({ y: 20 });
    });

    it('is as important as the view needs, so the view still shows it', () => {
      const year = periodOf('year', '2026-07-02');
      const state = reduce(base(), {
        type: 'add',
        viewKey: year.key,
        pathId: 'combat',
        x: 10,
        y: 20,
        date: '2026-07-02',
        importance: minImportanceOf(year),
      });

      const { data } = buildPeriodData({
        paths: state.paths,
        points: state.points,
        checkIns: [],
        period: year,
        page: 0,
        pins: {},
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

    it('forgets the height that was chosen for it', () => {
      const moved = reduce(base(), { type: 'move', viewKey: 'v', positions: {}, id: 'b', y: 9 });

      expect(reduce(moved, { type: 'delete', id: 'b' }).heights).toEqual({});
    });

    it('forgets the heights of the lines that led to it or from it', () => {
      const dragged = reduce(base(), { type: 'lineHeight', fromId: 'a', toId: 'b', y: 7 });
      const other = reduce(dragged, { type: 'lineHeight', fromId: 'c', toId: 'd', y: 8 });

      expect(reduce(other, { type: 'delete', id: 'b' }).lineHeights).toEqual({ 'c>d': 8 });
    });
  });

  describe('when the layout is rerolled', () => {
    it('clears the pins of that view and moves to the next seed', () => {
      const moved = reduce(base(), { type: 'move', viewKey: 'v', positions: { a: { x: 1, y: 1 } } });

      const state = reduce(moved, { type: 'reroll', viewKey: 'v' });

      expect(state.pins.v).toEqual({});
      expect(state.seeds.v).toBe(DEFAULT_SEED + 1);
    });

    it('lets go of the heights of the points of that view', () => {
      const moved = reduce(base(), {
        type: 'move',
        viewKey: 'v',
        positions: { a: { x: 1, y: 1 } },
        id: 'a',
        y: 1,
      });

      expect(reduce(moved, { type: 'reroll', viewKey: 'v' }).heights).toEqual({});
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
