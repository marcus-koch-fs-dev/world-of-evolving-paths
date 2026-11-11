import { describe, expect, it } from 'vitest';
import { levelThatShows, minImportanceOf, steppedYears, toggledLevels, widestLevelShowing } from './levels';

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

describe('Widest level showing a point', () => {
  const offered = ['week', 'month', 'year'] as const;

  it('is the widest view whose limit the importance reaches', () => {
    expect(widestLevelShowing(5, offered)?.level).toBe('year');
    expect(widestLevelShowing(3, offered)?.level).toBe('year');
    expect(widestLevelShowing(2, offered)?.level).toBe('month');
    expect(widestLevelShowing(1, offered)?.level).toBe('week');
  });

  it('is null when no offered view shows the point', () => {
    expect(widestLevelShowing(1, ['year'])).toBeNull();
  });
});

describe('Level that shows a point', () => {
  const offered = ['week', 'month', 'year'] as const;

  it('is the widest offered level that is fine enough', () => {
    expect(levelThatShows(1, 'year', offered)?.level).toBe('week');
    expect(levelThatShows(2, 'year', offered)?.level).toBe('month');
  });

  it('is null when the shown view shows the point already', () => {
    expect(levelThatShows(3, 'year', offered)).toBeNull();
    expect(levelThatShows(1, null, offered)).toBeNull();
  });

  it('skips levels that are not offered', () => {
    expect(levelThatShows(1, 'year', ['month', 'year'])).toBeNull();
  });
});

describe('Stepped years', () => {
  it('goes through 1, 2, 5 and 10 years', () => {
    expect(steppedYears(1, 1)).toBe(2);
    expect(steppedYears(2, 1)).toBe(5);
    expect(steppedYears(5, 1)).toBe(10);
    expect(steppedYears(5, -1)).toBe(2);
  });

  it('stays at both ends', () => {
    expect(steppedYears(10, 1)).toBe(10);
    expect(steppedYears(1, -1)).toBe(1);
  });

  it('moves a value in between to the next step', () => {
    expect(steppedYears(3, 1)).toBe(10);
    expect(steppedYears(3, -1)).toBe(2);
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
