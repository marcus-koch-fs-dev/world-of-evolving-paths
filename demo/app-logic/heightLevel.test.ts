import { describe, expect, it } from 'vitest';
import { periodOf } from 'world-of-evolving-paths';
import { heightLevelOf } from './heightLevel';

describe('Height level of a period', () => {
  describe('when the period is a week, a month or one year', () => {
    it('is its own level', () => {
      expect(heightLevelOf(periodOf('week', '2026-11-04'))).toBe('week');
      expect(heightLevelOf(periodOf('month', '2026-11-04'))).toBe('month');
      expect(heightLevelOf(periodOf('year', '2026-11-04'))).toBe('year');
    });
  });

  describe('when the period is an overview', () => {
    it('has none for several years', () => {
      expect(heightLevelOf(periodOf('year', '2026-11-04', { years: 5 }))).toBeNull();
    });

    it('has none for the free view', () => {
      expect(heightLevelOf(null)).toBeNull();
    });
  });
});
