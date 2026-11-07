import { describe, expect, it } from 'vitest';
import { STRENGTH_WEEKS, tierAt, tierOf, weeklyRate } from './strength';

describe('Path strength', () => {
  describe('when choosing a tier for an average', () => {
    it('starts as a desire path', () => {
      expect(tierOf(0)).toBe(0);
    });

    it.each([
      [1, 1],
      [2, 2],
      [3, 3],
      [4.9, 3],
      [5, 4],
    ])('maps %s per week to tier %s', (perWeek, tier) => {
      expect(tierOf(perWeek)).toBe(tier);
    });
  });

  describe('when counting reached points', () => {
    it('averages over the last four weeks', () => {
      const days = [100, 101, 102, 103];

      expect(weeklyRate(days, 103)).toBe(4 / STRENGTH_WEEKS);
    });

    it('ignores points older than the window and points in the future', () => {
      const days = [10, 100, 200];

      expect(weeklyRate(days, 100)).toBe(1 / STRENGTH_WEEKS);
    });

    it('gives a higher tier to a path walked more often', () => {
      const daily = Array.from({ length: 28 }, (_, i) => 100 + i);
      const weekly = [100, 107, 114, 121];

      expect(tierAt(daily, 127)).toBeGreaterThan(tierAt(weekly, 127));
    });
  });
});
