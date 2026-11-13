import { describe, expect, it, vi } from 'vitest';
import { createStore } from '../../core/store/levels.js';
import type { Store, StorePath } from '../../core/store/types.js';
import type { PathWorldOptions } from '../options.js';
import { createStoreEdits } from './createStoreEdits.js';

const pathWith = (id: string, pointId: string): StorePath => ({
  id,
  name: id,
  color: '#3a86ff',
  branches: [
    {
      id: `${id}-main`,
      points: [{ id: pointId, date: '2026-11-04', title: pointId, kind: 'milestone', status: 'open', prio: 3 }],
    },
  ],
});

const store = (): Store => createStore([pathWith('gym', 'a'), pathWith('reading', 'b')]);

/** The edits with a model that shows `level` (null is the overview) and options a test gives. */
function setup(options: Partial<PathWorldOptions> = {}, level: 'week' | null = 'week') {
  const current = store();
  const onStoreChange = vi.fn();
  const edits = createStoreEdits({
    options: () => ({ store: current, view: 'v', onStoreChange, ...options }),
    model: {
      store: () => current,
      level: () => level,
      world: () => ({
        today: '2026-11-11',
        period: level ? { start: 0, end: 1 } : null,
        // Two paths: the lanes are -100 (gym) and 100 (reading)
        paths: [
          { id: 'gym', name: 'gym', color: '#fff' },
          { id: 'reading', name: 'reading', color: '#fff' },
        ],
        points: [
          { id: 'a', pathId: 'gym' },
          { id: 'b', pathId: 'reading' },
        ],
        arrows: [{ key: 'reading/reading-main@2026-11-09', pathId: 'reading' }],
        spans: [],
      }),
    },
  } as unknown as Parameters<typeof createStoreEdits>[0]);
  return { edits, onStoreChange, current };
}

describe('Store edits', () => {
  describe('when the map is asked whether things can be moved', () => {
    it('says yes in a period when the app listens', () => {
      expect(setup().edits.canMove()).toBe(true);
    });

    it('says no when the app does not listen', () => {
      expect(setup({ onStoreChange: undefined }).edits.canMove()).toBe(false);
    });

    it('says no when points are locked', () => {
      expect(setup({ pointsLocked: true }).edits.canMove()).toBe(false);
    });

    it('says no in the overview unless it is moved freely', () => {
      expect(setup({}, null).edits.canMove()).toBe(false);
      expect(setup({ freeMove: true }, null).edits.canMove()).toBe(true);
    });

    it('lets a viewer arrange the overview, but not move things in a period', () => {
      expect(setup({ freeMove: true, editable: false }, null).edits.canMove()).toBe(true);
      expect(setup({ editable: false }).edits.canMove()).toBe(false);
    });
  });

  describe('when a point comes to rest in a period', () => {
    it('keeps its height as a distance from the lane of its path', () => {
      const { edits, onStoreChange } = setup();

      edits.movePoint('b', { x: 0, y: 130 });

      const [next] = onStoreChange.mock.calls[0];
      expect(next.paths[1].layout.heights.week.points.b).toBe(30);
    });

    it('hands over the path that changed and nothing else', () => {
      const { edits, onStoreChange, current } = setup();

      edits.movePoint('b', { x: 0, y: 130 });

      const [next, changes] = onStoreChange.mock.calls[0];
      expect(changes).toEqual({ changed: [next.paths[1]], removed: [] });
      expect(next.paths[0]).toBe(current.paths[0]);
    });
  });

  describe('when an arrow is dragged', () => {
    it('keeps its height as a distance from the lane of its path', () => {
      const { edits, onStoreChange } = setup();

      edits.moveArrow('reading/reading-main@2026-11-09', 140);

      const [next] = onStoreChange.mock.calls[0];
      expect(next.paths[1].layout.heights.week.arrows['reading/reading-main@2026-11-09']).toBe(40);
    });

    it('does nothing for an arrow that is not in the view', () => {
      const { edits, onStoreChange } = setup();

      edits.moveArrow('gym/gym-main@2026-11-09', 10);

      expect(onStoreChange).not.toHaveBeenCalled();
    });
  });

  describe('when a whole path is dragged in the overview', () => {
    it('moves its points to free places and hands over that path', () => {
      const { edits, onStoreChange } = setup({ freeMove: true }, null);

      edits.movePath('gym', { x: 10, y: 20 });

      const [next, changes] = onStoreChange.mock.calls[0];
      expect(changes.changed).toEqual([next.paths[0]]);
      expect(next.paths[0].layout.free.a).toBeDefined();
    });
  });
});
