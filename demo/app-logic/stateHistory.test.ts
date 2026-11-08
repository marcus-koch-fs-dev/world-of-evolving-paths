import { describe, expect, it } from 'vitest';
import { makePath, makePoint } from '../../tests/fixtures';
import { canRedo, canUndo } from './history';
import { initialState } from './state';
import { createStateHistory, historyReduce } from './stateHistory';

const start = () =>
  createStateHistory(
    initialState(
      [makePath('a')],
      [
        makePoint({ id: 'a1', pathId: 'a', date: '2026-11-03' }),
        makePoint({ id: 'a2', pathId: 'a', date: '2026-11-05' }),
      ],
    ),
  );

describe('Demo history', () => {
  describe('when an action changes the data', () => {
    it('can be undone and redone', () => {
      const history = historyReduce(start(), { type: 'update', id: 'a1', patch: { title: 'New name' } });

      const undone = historyReduce(history, { type: 'undo' });
      const redone = historyReduce(undone, { type: 'redo' });

      expect(history.present.points[0].title).toBe('New name');
      expect(undone.present.points[0].title).not.toBe('New name');
      expect(redone.present.points[0].title).toBe('New name');
    });

    it('brings a deleted point back', () => {
      const history = historyReduce(start(), { type: 'delete', id: 'a2' });

      const undone = historyReduce(history, { type: 'undo' });

      expect(history.present.points.map((point) => point.id)).toEqual(['a1']);
      expect(undone.present.points.map((point) => point.id)).toEqual(['a1', 'a2']);
    });
  });

  describe('when an action changes nothing', () => {
    it('is no step to undo', () => {
      const history = historyReduce(start(), { type: 'connect', fromId: 'a1', toId: 'a1' });

      expect(canUndo(history)).toBe(false);
    });
  });

  describe('when a new action follows an undo', () => {
    it('clears what could be redone', () => {
      const first = historyReduce(start(), { type: 'delete', id: 'a2' });
      const undone = historyReduce(first, { type: 'undo' });

      const next = historyReduce(undone, { type: 'update', id: 'a1', patch: { title: 'Other' } });

      expect(canRedo(next)).toBe(false);
    });
  });
});
