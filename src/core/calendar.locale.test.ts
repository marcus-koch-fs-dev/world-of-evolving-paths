import { describe, expect, it } from 'vitest';
import { periodLabel, periodOf } from './calendar.js';

describe('Period labels by language', () => {
  describe('when a locale is given', () => {
    it('writes a week the German way', () => {
      expect(periodLabel(periodOf('week', '2026-11-04'), 'de')).toBe('KW 45, 2.11. – 8.11.2026');
    });

    it('spells a month out in the language', () => {
      expect(periodLabel(periodOf('month', '2026-03-10'), 'de')).toBe('März 2026');
    });
  });

  describe('when no locale is given', () => {
    it('keeps the English label of the period', () => {
      const period = periodOf('week', '2026-11-04');

      expect(periodLabel(period)).toBe(period.label);
    });
  });
});
