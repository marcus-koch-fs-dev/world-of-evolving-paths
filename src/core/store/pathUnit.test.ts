import { describe, expect, it } from 'vitest';
import { replacePath, storeChanges } from './changes.js';
import { withArrowHeights, withFreePlaces, withoutHeights, withPointHeights } from './layoutEdits.js';
import { createStore } from './levels.js';
import type { Branch, Store, StorePath, StorePoint } from './types.js';
import { addPoint, removePoint, updatePath, updatePoint } from './update/edit.js';
import { moveArrow, movePoint } from './update/movePoint.js';
import { validateStore } from './validate.js';

const point = (id: string, date: string, prio = 3): StorePoint => ({
  id,
  date,
  title: id,
  kind: 'milestone',
  status: 'open',
  prio,
});

const branch = (id: string, points: StorePoint[], splitsAt?: string): Branch => ({ id, points, splitsAt });

const path = (id: string, branches: Branch[]): StorePath => ({ id, name: id, color: '#3a86ff', branches });

/** Two paths. The second one has a fork that leaves from the first point of the first path. */
function twoPaths(): Store {
  return createStore([
    path('a', [branch('a-main', [point('a1', '2026-11-02'), point('a2', '2026-11-20')])]),
    path('b', [
      branch('b-main', [point('b1', '2026-11-03'), point('b2', '2026-11-21')]),
      branch('b-fork', [point('b3', '2026-11-10')], 'a1'),
    ]),
  ]);
}

const idsOf = (changes: { changed: StorePath[] }) => changes.changed.map((changed) => changed.id);

describe('The path as the unit of a change', () => {
  describe('when the user arranges things', () => {
    it('keeps a point height in the path of the point and leaves the other path alone', () => {
      const before = twoPaths();

      const after = withPointHeights(before, 'week', { b1: -40 });

      expect(after.paths[0]).toBe(before.paths[0]);
      expect(after.paths[1].layout?.heights?.week?.points).toEqual({ b1: -40 });
    });

    it('keeps an arrow height in the path named in its key', () => {
      const before = twoPaths();

      const after = withArrowHeights(before, 'month', { 'b/b-main@2026-12-01': 25 });

      expect(storeChanges(before, after)).toEqual({ changed: [after.paths[1]], removed: [] });
      expect(after.paths[1].layout?.heights?.month?.arrows).toEqual({ 'b/b-main@2026-12-01': 25 });
    });

    it('keeps a free place in the path of the point', () => {
      const before = twoPaths();

      const after = withFreePlaces(before, { a2: { x: 5, y: 6 } });

      expect(idsOf(storeChanges(before, after))).toEqual(['a']);
      expect(after.paths[0].layout?.free).toEqual({ a2: { x: 5, y: 6 } });
    });

    it('splits heights for points of two paths between both paths', () => {
      const before = twoPaths();

      const after = withPointHeights(before, 'week', { a1: 10, b1: 20 });

      expect(idsOf(storeChanges(before, after))).toEqual(['a', 'b']);
    });

    it('changes nothing when a forgotten height was never kept', () => {
      const before = twoPaths();

      const after = withoutHeights(before, 'week', ['a1', 'b1'], ['a/a-main@2026-12-01']);

      expect(after).toEqual(before);
      expect(storeChanges(before, after).changed).toEqual([]);
    });

    it('forgets a kept height', () => {
      const kept = withPointHeights(twoPaths(), 'week', { a1: 10, a2: 20 });

      const after = withoutHeights(kept, 'week', ['a1'], []);

      expect(after.paths[0].layout?.heights?.week?.points).toEqual({ a2: 20 });
    });
  });

  describe('when the user moves something on the map', () => {
    it('changes only the path of a moved point', () => {
      const before = twoPaths();

      const after = movePoint(before, 'week', 'b2', -30);

      expect(idsOf(storeChanges(before, after))).toEqual(['b']);
    });

    it('also changes the fork path when the point is the one the fork leaves from', () => {
      const before = twoPaths();

      const after = movePoint(before, 'week', 'a1', -30);

      expect(idsOf(storeChanges(before, after))).toEqual(['a', 'b']);
    });

    it('changes only the path of a moved arrow', () => {
      const before = twoPaths();

      const after = moveArrow(before, 'month', 'a/a-main@2026-12-01', 12);

      expect(idsOf(storeChanges(before, after))).toEqual(['a']);
    });
  });

  describe('when the app edits the data', () => {
    it('changes only the path of an edited point', () => {
      const before = twoPaths();

      const after = updatePoint(before, 'a2', { title: 'new title' });

      expect(idsOf(storeChanges(before, after))).toEqual(['a']);
    });

    it('changes only the path that got a new point', () => {
      const before = twoPaths();

      const after = addPoint(before, 'b-main', point('b9', '2026-11-12'));

      expect(idsOf(storeChanges(before, after))).toEqual(['b']);
    });

    it('drops the heights and the free place of a removed point', () => {
      const arranged = withFreePlaces(withPointHeights(twoPaths(), 'week', { a2: 10 }), { a2: { x: 1, y: 2 } });

      const after = removePoint(arranged, 'a2');

      expect(after.paths[0].layout?.heights?.week?.points).toEqual({});
      expect(after.paths[0].layout?.free).toEqual({});
      expect(after.paths[1]).toBe(arranged.paths[1]);
    });

    it('changes only the path that was renamed', () => {
      const before = twoPaths();

      const after = updatePath(before, 'b', { name: 'Bee' });

      expect(idsOf(storeChanges(before, after))).toEqual(['b']);
    });
  });

  describe('when two stores are compared', () => {
    it('reports nothing for the same store', () => {
      const store = twoPaths();

      expect(storeChanges(store, store)).toEqual({ changed: [], removed: [] });
    });

    it('reports a new path as changed', () => {
      const before = twoPaths();
      const added = path('c', []);

      const after = { paths: [...before.paths, added] };

      expect(storeChanges(before, after)).toEqual({ changed: [added], removed: [] });
    });

    it('reports the id of a path that is gone', () => {
      const before = twoPaths();

      const after = { paths: [before.paths[0]] };

      expect(storeChanges(before, after)).toEqual({ changed: [], removed: ['b'] });
    });

    it('reports a replaced path once, as changed and not as removed', () => {
      const before = twoPaths();
      const replacement = { ...before.paths[1], name: 'Bee' };

      const after = replacePath(before, replacement);

      expect(storeChanges(before, after)).toEqual({ changed: [replacement], removed: [] });
    });
  });

  describe('when the data is checked', () => {
    it('accepts the paths with their layout', () => {
      const arranged = withPointHeights(twoPaths(), 'week', { a1: 5 });

      expect(validateStore(arranged.paths)).toEqual([]);
    });

    it('rejects a path id with a slash, because the keys of the arrows start with it', () => {
      const store = createStore([path('a/b', [])]);

      expect(validateStore(store.paths)).toEqual(['Path id "a/b" must not contain a slash.']);
    });
  });
});
