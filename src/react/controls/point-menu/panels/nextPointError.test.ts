import { describe, expect, it } from 'vitest';
import { isBeforeFollowed, nextPointError, startsNewBranchByDefault } from './nextPointError.js';

describe('Next point input', () => {
  describe('after a fork point', () => {
    it('starts a new branch by default, also when a branch already leaves from it', () => {
      expect(startsNewBranchByDefault('crossroad', false)).toBe(true);
      expect(startsNewBranchByDefault('milestone', true)).toBe(true);
    });
  });

  describe('after an ordinary point', () => {
    it('continues the same branch by default', () => {
      expect(startsNewBranchByDefault('milestone', false)).toBe(false);
    });
  });

  describe('when the name is empty or only spaces', () => {
    it('asks for the name', () => {
      const error = nextPointError('   ', '2026-01-01');

      expect(error).toBe('The name is missing.');
    });
  });

  describe('when the date is missing', () => {
    it('asks for the date', () => {
      const error = nextPointError('Goal', '');

      expect(error).toMatch(/date is missing/);
    });
  });

  describe('when name and date are there', () => {
    it('has no error', () => {
      const error = nextPointError('Goal', '2026-01-01');

      expect(error).toBeNull();
    });
  });

  describe('when the date is before the followed point', () => {
    it('is flagged, and an empty date is not', () => {
      expect(isBeforeFollowed('2026-01-01', '2026-02-01')).toBe(true);
      expect(isBeforeFollowed('', '2026-02-01')).toBe(false);
      expect(isBeforeFollowed('2026-03-01', '2026-02-01')).toBe(false);
    });
  });
});
