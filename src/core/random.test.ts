import { describe, expect, it } from 'vitest';
import { createSequence, pick } from './random.js';

describe('Random', () => {
  describe('when the same seed starts two sequences', () => {
    it('gives the same numbers, all in [0, 1)', () => {
      const first = createSequence(42);
      const second = createSequence(42);

      const a = Array.from({ length: 5 }, first);
      const b = Array.from({ length: 5 }, second);

      expect(a).toEqual(b);
      expect(a.every((value) => value >= 0 && value < 1)).toBe(true);
    });
  });

  describe('when the seeds differ', () => {
    it('gives different numbers', () => {
      const a = createSequence(1)();
      const b = createSequence(2)();

      expect(a).not.toBe(b);
    });
  });

  describe('when names are picked', () => {
    it('gives numbers in [0, 1) that differ by name', () => {
      const values = ['a|s', 'a|y', 'b|y', 'point-1|y'].map(pick);

      expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe('when a name is picked twice', () => {
    it('gives the same number', () => {
      expect(pick('point-1|y')).toBe(pick('point-1|y'));
    });
  });
});
