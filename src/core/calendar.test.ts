import { describe, expect, it } from 'vitest';
import { periodFromKey, periodOf, shiftPeriod } from './calendar';
import { fromDay } from './dates';

describe('Calendar', () => {
  describe('when building a week', () => {
    it('starts on Monday by default', () => {
      const period = periodOf('week', '2026-11-04');

      expect(fromDay(period.start)).toBe('2026-11-02');
      expect(fromDay(period.end)).toBe('2026-11-08');
    });

    it('labels a Monday week with its calendar week', () => {
      expect(periodOf('week', '2026-11-04').label).toContain('CW 45');
    });

    it('starts on the chosen weekday', () => {
      const period = periodOf('week', '2026-11-04', { weekStart: 4 });

      expect(fromDay(period.start)).toBe('2026-10-30');
    });
  });

  describe('when building other levels', () => {
    it('covers a whole month', () => {
      const period = periodOf('month', '2026-11-15');

      expect(fromDay(period.start)).toBe('2026-11-01');
      expect(fromDay(period.end)).toBe('2026-11-30');
    });

    it('splits the year into two halves', () => {
      expect(periodOf('halfYear', '2026-03-01').label).toBe('H1 2026');
      expect(periodOf('halfYear', '2026-09-01').label).toBe('H2 2026');
    });

    it('keeps a day as one day', () => {
      const period = periodOf('day', '2026-11-07');

      expect(period.start).toBe(period.end);
    });
  });

  describe('when reading a key', () => {
    it('restores the same period, also for a week that starts on Friday', () => {
      const original = periodOf('week', '2026-11-04', { weekStart: 4 });

      const restored = periodFromKey(original.key);

      expect(restored).toEqual(original);
    });

    it('returns null for a key that is not a period', () => {
      expect(periodFromKey('free')).toBeNull();
    });

    it('returns null for a date that does not exist', () => {
      expect(periodFromKey('week:2026-13-40')).toBeNull();
    });
  });

  describe('when shifting', () => {
    it('moves a month back across the year boundary', () => {
      const period = shiftPeriod(periodOf('month', '2026-01-10'), -1);

      expect(period.label).toBe('December 2025');
    });

    it('moves a half year forward', () => {
      const period = shiftPeriod(periodOf('halfYear', '2026-03-01'), 1);

      expect(period.label).toBe('H2 2026');
    });

    it('keeps the weekday a week starts on', () => {
      const friday = periodOf('week', '2026-11-04', { weekStart: 4 });

      const next = shiftPeriod(friday, 1);

      expect(fromDay(next.start)).toBe('2026-11-06');
    });
  });
});
