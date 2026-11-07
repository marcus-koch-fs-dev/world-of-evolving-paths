import { describe, expect, it, vi } from 'vitest';
import type { PathWorldOptions } from '../options';
import { createBoundaryChecks } from './boundary';

const options = (extra: Partial<PathWorldOptions>): PathWorldOptions => ({ periods: {}, view: 'v', ...extra });

describe('Boundary checks', () => {
  describe('when today is wrong', () => {
    it('reports it once and falls back to a valid date', () => {
      const report = vi.fn();
      const { todayOf } = createBoundaryChecks(report);

      const first = todayOf(options({ today: '2026-13-40' }));
      todayOf(options({ today: '2026-13-40' }));

      expect(first).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(report).toHaveBeenCalledTimes(1);
    });

    it('passes a valid date through without a report', () => {
      const report = vi.fn();

      expect(createBoundaryChecks(report).todayOf(options({ today: '2026-11-02' }))).toBe('2026-11-02');
      expect(report).not.toHaveBeenCalled();
    });
  });

  describe('when the locale is wrong', () => {
    it('reports it once and uses the browser language', () => {
      const report = vi.fn();
      const { localeOf } = createBoundaryChecks(report);

      expect(localeOf(options({ locale: 'not a locale!' }))).toBeUndefined();
      localeOf(options({ locale: 'not a locale!' }));

      expect(report).toHaveBeenCalledTimes(1);
    });

    it('keeps a known locale', () => {
      expect(createBoundaryChecks(vi.fn()).localeOf(options({ locale: 'de' }))).toBe('de');
    });
  });

  describe('when a background color is wrong', () => {
    it('reports it once and leaves that color out', () => {
      const report = vi.fn();
      const { backgroundOf } = createBoundaryChecks(report);
      const wrong = options({ background: { base: 'red', color2: '#112233', pattern: 'dots' } });

      const checked = backgroundOf(wrong);
      backgroundOf(wrong);

      expect(checked).toEqual({ base: undefined, color2: '#112233', pattern: 'dots' });
      expect(report).toHaveBeenCalledTimes(1);
    });

    it('returns the very same object when all colors are fine', () => {
      const background = { base: '#000000', color: '#ffffff' };

      expect(createBoundaryChecks(vi.fn()).backgroundOf(options({ background }))).toBe(background);
    });
  });
});
