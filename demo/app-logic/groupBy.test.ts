import { describe, expect, it } from 'vitest';
import { groupBy } from './groupBy';

describe('Group by', () => {
  describe('when items share a key', () => {
    it('collects them in their original order', () => {
      const items = [
        { id: 1, kind: 'a' },
        { id: 2, kind: 'b' },
        { id: 3, kind: 'a' },
      ];

      const groups = groupBy(items, (item) => item.kind);

      expect(groups.get('a')?.map((item) => item.id)).toEqual([1, 3]);
      expect(groups.get('b')?.map((item) => item.id)).toEqual([2]);
    });
  });

  describe('when there are no items', () => {
    it('gives no groups', () => {
      const groups = groupBy([], (item: string) => item);

      expect(groups.size).toBe(0);
    });
  });
});
