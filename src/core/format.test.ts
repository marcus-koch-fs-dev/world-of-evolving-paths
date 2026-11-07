import { describe, expect, it } from 'vitest';
import { formatNumericDate, formatPointDate, weekPrefix } from './format';

describe('Date formats by language', () => {
  describe('when writing a numeric date', () => {
    it('writes day, month and year in German order', () => {
      expect(formatNumericDate('2026-11-02', 'de')).toBe('2.11.2026');
    });

    it('leaves out the year when asked, for a short date', () => {
      expect(formatNumericDate('2026-11-02', 'de', false)).toBe('2.11.');
    });

    it('follows the order of US English', () => {
      expect(formatNumericDate('2026-11-02', 'en-US')).toBe('11/2/2026');
    });
  });

  describe('when writing the date under a point', () => {
    it('leaves out the year for the current year', () => {
      expect(formatPointDate('2026-11-02', '2026-11-07', 'de')).toBe('2.11.');
    });

    it('shows the year for another year', () => {
      expect(formatPointDate('2025-11-02', '2026-11-07', 'de')).toBe('2.11.2025');
    });
  });

  describe('when choosing the word for calendar week', () => {
    it.each([
      ['de', 'KW'],
      ['de-AT', 'KW'],
      ['en', 'CW'],
      [undefined, 'CW'],
    ])('uses %s → %s', (locale, expected) => {
      expect(weekPrefix(locale)).toBe(expected);
    });
  });
});
