import { describe, expect, it } from 'vitest';
import { finerLevel } from './zoom';

const DEFAULT_LEVELS = ['week', 'month', 'year'] as const;

describe('Finer level', () => {
  describe('when a point is double-clicked', () => {
    it('goes from the year to the month', () => {
      expect(finerLevel('year', DEFAULT_LEVELS)).toBe('month');
    });

    it('goes from the month to the week', () => {
      expect(finerLevel('month', DEFAULT_LEVELS)).toBe('week');
    });

    it('goes from the free view to the year', () => {
      expect(finerLevel(null, DEFAULT_LEVELS)).toBe('year');
    });
  });

  describe('when there is nothing finer', () => {
    it('is null on the week, the finest level', () => {
      expect(finerLevel('week', DEFAULT_LEVELS)).toBeNull();
    });
  });

  describe('when a level is not offered', () => {
    it('skips it and takes the next one that is', () => {
      expect(finerLevel('year', ['week', 'year'])).toBe('week');
    });
  });
});
