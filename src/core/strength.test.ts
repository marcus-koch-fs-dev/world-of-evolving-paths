import { describe, expect, it } from 'vitest';
import { activeDaysIn, STRENGTH_RULE, tierAt, tierOf } from './strength';

const consecutive = (from: number, count: number) => Array.from({ length: count }, (_, i) => from + i);

describe('Path strength', () => {
  describe('when choosing a tier for a number of active days', () => {
    it('starts as a desire path', () => {
      expect(tierOf(0)).toBe(0);
    });

    it.each([
      [5, 0],
      [6, 1],
      [17, 1],
      [18, 2],
      [39, 2],
      [40, 3],
      [69, 3],
      [70, 4],
    ])('maps %s active days to tier %s', (activeDays, tier) => {
      expect(tierOf(activeDays)).toBe(tier);
    });

    it('uses the rule it is given', () => {
      const rule = { weeks: 4, minActiveDays: [0, 1, 2, 3, 4] };

      expect(tierOf(3, rule)).toBe(3);
    });
  });

  describe('when counting active days', () => {
    it('counts a day once, however many check-ins it has', () => {
      expect(activeDaysIn([100, 100, 100, 101], 101)).toBe(2);
    });

    it('ignores days outside the window and days in the future', () => {
      const window = STRENGTH_RULE.weeks * 7;

      expect(activeDaysIn([100 - window, 100 - window + 1, 101], 100)).toBe(1);
    });
  });

  describe('when a path is walked over time', () => {
    it('grows from a desire path to a highway with a daily habit', () => {
      const days = consecutive(0, 100);

      expect(tierAt(days, 2)).toBe(0);
      expect(tierAt(days, 10)).toBe(1);
      expect(tierAt(days, 45)).toBe(3);
      expect(tierAt(days, 80)).toBe(4);
    });

    it('keeps a once-a-week habit at the path tier', () => {
      const weekly = Array.from({ length: 30 }, (_, i) => i * 7);

      expect(tierAt(weekly, 200)).toBe(1);
    });

    it('shrinks again when the habit stops', () => {
      const days = consecutive(0, 80);

      expect(tierAt(days, 79)).toBe(4);
      expect(tierAt(days, 79 + 60)).toBeLessThan(4);
    });
  });
});
