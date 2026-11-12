import { describe, expect, it } from 'vitest';
import { createStore, type StorePoint } from 'world-of-evolving-paths';
import { canRedo, canUndo } from './history';
import { initialState } from './state';
import { createStateHistory, historyReduce } from './stateHistory';

const point = (id: string, date: string): StorePoint => ({
  id,
  date,
  title: id,
  kind: 'milestone',
  status: 'open',
  prio: 3,
});

const start = () =>
  createStateHistory(
    initialState(
      createStore([
        {
          id: 'a',
          name: 'a',
          color: '#3a86ff',
          branches: [{ id: 'a-main', points: [point('a1', '2026-11-03'), point('a2', '2026-11-05')] }],
        },
      ]),
    ),
  );

const pointsOf = (history: ReturnType<typeof start>) => history.present.store.paths[0].branches[0].points;

describe('Demo history', () => {
  describe('when an action changes the data', () => {
    it('can be undone and redone', () => {
      const history = historyReduce(start(), { type: 'update', id: 'a1', patch: { title: 'New name' } });

      const undone = historyReduce(history, { type: 'undo' });
      const redone = historyReduce(undone, { type: 'redo' });

      expect(pointsOf(history)[0].title).toBe('New name');
      expect(pointsOf(undone)[0].title).not.toBe('New name');
      expect(pointsOf(redone)[0].title).toBe('New name');
    });

    it('brings a deleted point back', () => {
      const history = historyReduce(start(), { type: 'delete', id: 'a2' });

      const undone = historyReduce(history, { type: 'undo' });

      expect(pointsOf(history).map((item) => item.id)).toEqual(['a1']);
      expect(pointsOf(undone).map((item) => item.id)).toEqual(['a1', 'a2']);
    });
  });

  describe('when an action changes nothing', () => {
    it('is no step to undo', () => {
      const once = historyReduce(start(), { type: 'checkIn', pathId: 'a', date: '2026-11-05' });

      const twice = historyReduce(once, { type: 'checkIn', pathId: 'a', date: '2026-11-05' });

      expect(twice).toBe(once);
    });
  });

  describe('when a new action follows an undo', () => {
    it('clears what could be redone', () => {
      const first = historyReduce(start(), { type: 'delete', id: 'a2' });
      const undone = historyReduce(first, { type: 'undo' });

      const next = historyReduce(undone, { type: 'update', id: 'a1', patch: { title: 'Other' } });

      expect(canRedo(next)).toBe(false);
      expect(canUndo(next)).toBe(true);
    });
  });
});
