import { describe, expect, it } from 'vitest';
import { makePath, makePoint } from '../../tests/fixtures';
import { minImportanceOf } from './levels';
import { canComplete } from './rules';
import { connectProblem, DEFAULT_SEED, type DemoState, initialState, nextPointProblem, reduce } from './state';

const base = (): DemoState =>
  initialState(
    [makePath('combat')],
    [makePoint({ id: 'a', status: 'done', next: ['b'] }), makePoint({ id: 'b', status: 'open' })],
  );

describe('Demo app state', () => {
  describe('when a point is moved', () => {
    it('pins all positions of that view', () => {
      const positions = { a: { x: 1, y: 2 }, b: { x: 3, y: 4 } };

      const state = reduce(base(), { type: 'move', viewKey: 'week:p0', positions });

      expect(state.pins['week:p0']).toEqual(positions);
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
      expect(state.pins.v['custom-1']).toEqual({ x: 10, y: 20 });
    });

    it('is as important as the view needs, so the view still shows it', () => {
      const importance = minImportanceOf('year');
      const state = reduce(base(), {
        type: 'add',
        viewKey: 'v',
        pathId: 'combat',
        x: 10,
        y: 20,
        date: '2026-07-02',
        importance,
      });

      const added = state.points.find((point) => point.id === 'custom-1');
      expect(added?.importance).toBe(3);
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
      const input = { title: 'Next', date: '2026-11-10', newPath: false, color: '#ffffff' };

      const state = reduce(base(), { type: 'addNext', fromId: 'b', input });

      expect(state.points.find((point) => point.id === 'b')?.next).toEqual(['custom-1']);
    });

    it('creates a new path when asked to', () => {
      const input = { title: 'Side quest', date: '2026-11-10', newPath: true, color: '#123456' };

      const state = reduce(base(), { type: 'addNext', fromId: 'b', input });

      expect(state.paths).toHaveLength(2);
      expect(state.points.find((point) => point.id === 'custom-1')?.pathId).toBe('custom-path-1');
    });

    it('rejects an empty name and a bad date', () => {
      expect(nextPointProblem({ title: ' ', date: '2026-11-10', newPath: false, color: '#fff' })).toContain('name');
      expect(nextPointProblem({ title: 'x', date: '10.11.2026', newPath: false, color: '#fff' })).toContain('date');
    });
  });

  describe('when a point is deleted', () => {
    it('removes it and the links that led to it', () => {
      const state = reduce(base(), { type: 'delete', id: 'b' });

      expect(state.points.map((point) => point.id)).toEqual(['a']);
      expect(state.points[0].next).toEqual([]);
    });
  });

  describe('when the layout is rerolled', () => {
    it('clears the pins of that view and moves to the next seed', () => {
      const moved = reduce(base(), { type: 'move', viewKey: 'v', positions: { a: { x: 1, y: 1 } } });

      const state = reduce(moved, { type: 'reroll', viewKey: 'v' });

      expect(state.pins.v).toEqual({});
      expect(state.seeds.v).toBe(DEFAULT_SEED + 1);
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
      const input = { title: 'Next', date: '2026-11-10', newPath: false, color: '#ffffff' };

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
