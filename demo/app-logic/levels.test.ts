import { describe, expect, it } from 'vitest';
import { minImportanceOf, toggledLevels } from './levels';

describe('Least importance of a view', () => {
  it('is higher the wider the view is', () => {
    expect(minImportanceOf({ level: 'week' })).toBe(1);
    expect(minImportanceOf({ level: 'month' })).toBe(2);
    expect(minImportanceOf({ level: 'year' })).toBe(3);
  });

  it('is 2 in the free view', () => {
    expect(minImportanceOf(null)).toBe(2);
  });
});

describe('Toggled levels', () => {
  describe('when a level is switched on', () => {
    it('joins in the order of the view bar', () => {
      const levels = toggledLevels(['month', 'year'], 'week', true);

      expect(levels).toEqual(['week', 'month', 'year']);
    });
  });

  describe('when a level is switched off', () => {
    it('leaves the list', () => {
      const levels = toggledLevels(['week', 'month'], 'week', false);

      expect(levels).toEqual(['month']);
    });
  });

  describe('when the last level is switched off', () => {
    it('keeps it, so the view bar is never empty', () => {
      const levels = toggledLevels(['month'], 'month', false);

      expect(levels).toEqual(['month']);
    });
  });
});
