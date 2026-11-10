import { describe, expect, it } from 'vitest';
import { finerLevel } from './zoom';

const DEFAULT_LEVELS = ['week', 'month', 'halfYear', 'year'] as const;

describe('Finer level', () => {
  describe('when a point is double-clicked', () => {
    it('goes from the year to the month, and skips the half year', () => {
      expect(finerLevel('year', DEFAULT_LEVELS)).toBe('month');
    });

    it('goes from the month to the week', () => {
      expect(finerLevel('month', DEFAULT_LEVELS)).toBe('week');
    });

    it('goes from the half year to the month', () => {
      expect(finerLevel('halfYear', DEFAULT_LEVELS)).toBe('month');
    });

    it('goes from the free view to the year', () => {
      expect(finerLevel(null, DEFAULT_LEVELS)).toBe('year');
    });
  });

  describe('when there is nothing finer', () => {
    it('stays where it is on the week if the day is not offered', () => {
      expect(finerLevel('week', DEFAULT_LEVELS)).toBeNull();
    });

    it('goes from the week to the day if the day is offered', () => {
      expect(finerLevel('week', ['day', 'week'])).toBe('day');
    });

    it('is null on the day', () => {
      expect(finerLevel('day', ['day', 'week'])).toBeNull();
    });
  });

  describe('when a level is not offered', () => {
    it('skips it and takes the next one that is', () => {
      expect(finerLevel('year', ['week', 'year'])).toBe('week');
    });
  });
});
