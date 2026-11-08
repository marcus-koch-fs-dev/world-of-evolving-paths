import { describe, expect, it } from 'vitest';
import { canRedo, canUndo, createHistory, record, redo, undo } from './history';

describe('History', () => {
  describe('when it just started', () => {
    it('has nothing to undo or redo', () => {
      const history = createHistory('a');

      expect(canUndo(history)).toBe(false);
      expect(canRedo(history)).toBe(false);
    });
  });

  describe('when values are recorded', () => {
    it('keeps the earlier ones and clears what could be redone', () => {
      const first = record(createHistory('a'), 'b');
      const undone = undo(first);

      const changed = record(undone, 'c');

      expect(changed).toEqual({ past: ['a'], present: 'c', future: [] });
    });

    it('ignores the same value, so an action that changed nothing is no step', () => {
      const history = createHistory({ n: 1 });

      const same = record(history, history.present);

      expect(same).toBe(history);
    });

    it('keeps only the last 100 steps', () => {
      const history = Array.from({ length: 150 }, (_, i) => i + 1).reduce(record, createHistory(0));

      expect(history.past).toHaveLength(100);
      expect(history.past[0]).toBe(50);
      expect(history.present).toBe(150);
    });
  });

  describe('when going back and forward', () => {
    it('undoes and redoes step by step', () => {
      const history = record(record(createHistory('a'), 'b'), 'c');

      const back = undo(undo(history));
      const forward = redo(back);

      expect(back.present).toBe('a');
      expect(canUndo(back)).toBe(false);
      expect(forward.present).toBe('b');
      expect(canRedo(forward)).toBe(true);
    });

    it('does nothing without a step to go to', () => {
      const history = createHistory('a');

      expect(undo(history)).toBe(history);
      expect(redo(history)).toBe(history);
    });
  });
});
