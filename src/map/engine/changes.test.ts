import { describe, expect, it } from 'vitest';
import type { PathWorldOptions } from '../options.js';
import { lookChanged } from './changes.js';

const base: PathWorldOptions = { periods: {}, view: 'week' };

describe('Look changes', () => {
  describe('when only the data or the view differ', () => {
    it('is not a change of look', () => {
      const next = { ...base, view: 'month' };

      expect(lookChanged(base, next)).toBe(false);
    });
  });

  describe('when the wave is turned on', () => {
    it('is a change of look, and an unset wave equals false', () => {
      expect(lookChanged(base, { ...base, wavy: true })).toBe(true);
      expect(lookChanged(base, { ...base, wavy: false })).toBe(false);
    });
  });

  describe('when the language or the date writer differ', () => {
    it('is a change of look', () => {
      expect(lookChanged(base, { ...base, locale: 'de' })).toBe(true);
      expect(lookChanged(base, { ...base, formatDate: (iso) => iso })).toBe(true);
    });
  });
});
