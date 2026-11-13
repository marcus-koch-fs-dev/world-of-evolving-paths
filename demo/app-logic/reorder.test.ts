import { describe, expect, it } from 'vitest';
import { movedTo, slotAt } from './reorder';

describe('Reordering by dragging', () => {
  describe('slotAt', () => {
    const middles = [10, 30, 50];

    it('is the number of rows whose middle the pointer has passed', () => {
      expect(slotAt(middles, 0)).toBe(0);
      expect(slotAt(middles, 20)).toBe(1);
      expect(slotAt(middles, 40)).toBe(2);
    });

    it('stays inside the list, far above or far below', () => {
      expect(slotAt(middles, -100)).toBe(0);
      expect(slotAt(middles, 999)).toBe(2);
    });
  });

  describe('movedTo', () => {
    it('moves an item to an earlier or later place', () => {
      expect(movedTo(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b']);
      expect(movedTo(['a', 'b', 'c'], 'a', 2)).toEqual(['b', 'c', 'a']);
    });

    it('keeps the list when the item stays where it is', () => {
      expect(movedTo(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'b', 'c']);
    });

    it('keeps the place within the list', () => {
      expect(movedTo(['a', 'b'], 'a', 9)).toEqual(['b', 'a']);
      expect(movedTo(['a', 'b'], 'b', -3)).toEqual(['b', 'a']);
    });
  });
});
