import { describe, expect, it } from 'vitest';
import { periodFromKey, periodOf, shiftPeriod, VIEW_LEVELS } from './calendar.js';
import { fromDay } from './dates.js';

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

    it('has only the levels week, month and year', () => {
      expect(VIEW_LEVELS.map((option) => option.level)).toEqual(['week', 'month', 'year']);
    });
  });

  describe('when reading a key', () => {
    it('does not know the levels that were removed', () => {
      expect(periodFromKey('day:2026-11-07')).toBeNull();
      expect(periodFromKey('halfYear:2026-01-01')).toBeNull();
    });

    it('takes a length in years only on the year level', () => {
      expect(periodFromKey('month:2026-11-01+2')).toBeNull();
      expect(periodFromKey('year:2022-01-01+5')?.label).toBe('2022–2026');
    });

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

    it('keeps the weekday a week starts on', () => {
      const friday = periodOf('week', '2026-11-04', { weekStart: 4 });

      const next = shiftPeriod(friday, 1);

      expect(fromDay(next.start)).toBe('2026-11-06');
    });
  });

  describe('when building a period of several years', () => {
    it('ends with the year of the date', () => {
      const period = periodOf('year', '2026-11-04', { years: 2 });

      expect(fromDay(period.start)).toBe('2025-01-01');
      expect(fromDay(period.end)).toBe('2026-12-31');
      expect(period.label).toBe('2025–2026');
    });

    it('is a plain year by default and keeps its short key', () => {
      const period = periodOf('year', '2026-11-04');

      expect(period.label).toBe('2026');
      expect(period.key).toBe('year:2026-01-01');
    });

    it('limits the length to 1 to 10 years', () => {
      expect(periodOf('year', '2026-11-04', { years: 0 }).label).toBe('2026');
      expect(periodOf('year', '2026-11-04', { years: 99 }).label).toBe('2017–2026');
    });

    it('moves by its whole length', () => {
      const period = periodOf('year', '2026-11-04', { years: 2 });

      expect(shiftPeriod(period, -1).label).toBe('2023–2024');
      expect(shiftPeriod(period, 1).label).toBe('2027–2028');
    });

    it('can be read back from its key', () => {
      const period = periodOf('year', '2026-11-04', { years: 5 });

      expect(period.key).toBe('year:2022-01-01+5');
      expect(periodFromKey(period.key)).toEqual(period);
    });
  });
});
