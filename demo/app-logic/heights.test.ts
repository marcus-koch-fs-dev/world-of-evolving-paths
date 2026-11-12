import { describe, expect, it } from 'vitest';
import { changeAllLevels, changeLevel, emptyHeights, omitKeys } from './heights';

describe('Heights per level', () => {
  describe('when one level is changed', () => {
    it('changes only that level', () => {
      const heights = changeLevel(emptyHeights(), 'month', (current) => ({ ...current, a: 5 }));

      expect(heights).toEqual({ week: {}, month: { a: 5 }, year: {} });
    });

    it('keeps everything as it is in an overview', () => {
      const heights = emptyHeights();

      expect(changeLevel(heights, null, () => ({ a: 5 }))).toBe(heights);
    });
  });

  describe('when every level is changed', () => {
    it('makes the same change on all of them', () => {
      const heights = changeAllLevels({ week: { a: 1 }, month: { a: 2 }, year: { b: 3 } }, (current) =>
        omitKeys(current, ['a']),
      );

      expect(heights).toEqual({ week: {}, month: {}, year: { b: 3 } });
    });
  });

  describe('when keys are left out of a record', () => {
    it('keeps the others', () => {
      expect(omitKeys({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ b: 2 });
    });
  });
});
