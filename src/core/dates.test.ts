import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatMonthYear,
  fromDay,
  isIsoDate,
  isoWeekNumber,
  monthSpan,
  toDay,
  weekdayOf,
} from './dates.js';

describe('Dates', () => {
  describe('when converting between ISO dates and day numbers', () => {
    it('round-trips a date', () => {
      const iso = '2026-11-07';

      const result = fromDay(toDay(iso));

      expect(result).toBe(iso);
    });

    it('rejects a date that does not exist', () => {
      expect(() => toDay('2026-02-30')).toThrow('Invalid date');
    });

    it('rejects text that is not a date', () => {
      expect(isIsoDate('7.11.2026')).toBe(false);
    });
  });

  describe('when asking for the week', () => {
    it('counts Monday as weekday 0', () => {
      expect(weekdayOf(toDay('2026-11-02'))).toBe(0);
    });

    it('gives the ISO week number', () => {
      expect(isoWeekNumber(toDay('2026-11-02'))).toBe(45);
    });

    it('puts the first days of January into the last week of the old year when ISO says so', () => {
      expect(isoWeekNumber(toDay('2027-01-01'))).toBe(53);
    });
  });

  describe('when asking for a month', () => {
    it('knows the length of February in a common year', () => {
      const span = monthSpan('2026-02');

      expect(span.end - span.start).toBe(27);
    });

    it('knows the length of February in a leap year', () => {
      const span = monthSpan('2028-02');

      expect(span.end - span.start).toBe(28);
    });
  });

  describe('when formatting', () => {
    it('writes day, short month and year', () => {
      expect(formatDate('2026-11-07')).toBe('7 Nov 2026');
    });

    it('writes short month and year', () => {
      expect(formatMonthYear('2026-11-07')).toBe('Nov 2026');
    });
  });
});
