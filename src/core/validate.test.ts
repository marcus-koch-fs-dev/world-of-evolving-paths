import { describe, expect, it } from 'vitest';
import { editPoint, makePeriodData } from '../../tests/fixtures';
import { validatePeriodData } from './validate';

function errorsFor(input: unknown): string[] {
  const result = validatePeriodData(input);
  return result.ok ? [] : result.errors;
}

describe('Period data validation', () => {
  describe('when the data is valid', () => {
    it('accepts it', () => {
      expect(validatePeriodData(makePeriodData()).ok).toBe(true);
    });
  });

  describe('when the shape is wrong', () => {
    it('rejects something that is not an object', () => {
      expect(errorsFor('nope')[0]).toContain('must be an object');
    });

    it('rejects a path without points', () => {
      const path = { id: 'a', name: 'a', color: '#ffffff' };

      expect(errorsFor({ paths: [path] })[0]).toContain('points must be a list');
    });
  });

  describe('when a point is wrong', () => {
    it('names the point and the date problem', () => {
      const data = editPoint(makePeriodData(), 'c1', { date: '2026-02-30' });

      expect(errorsFor(data)).toContain('paths[0].points[0].date must be a valid YYYY-MM-DD date.');
    });

    it('rejects an importance outside 1 to 5', () => {
      const data = editPoint(makePeriodData(), 'c1', { importance: 9 });

      expect(errorsFor(data)[0]).toContain('importance');
    });

    it('rejects a pin with only one coordinate', () => {
      const data = editPoint(makePeriodData(), 'c1', { x: 10 });

      expect(errorsFor(data)[0]).toContain('both x and y');
    });
  });

  describe('when ids do not fit together', () => {
    it('rejects a duplicate point id', () => {
      const data = editPoint(makePeriodData(), 'c2', { id: 'c1' });

      expect(errorsFor(data)[0]).toContain('used twice');
    });

    it('rejects a duplicate path id', () => {
      const data = makePeriodData();
      const twice = { paths: [...data.paths, { ...data.paths[0] }] };

      expect(errorsFor(twice).some((error) => error.includes('Path id'))).toBe(true);
    });

    it('rejects a strength that is not a whole number', () => {
      const data = editPoint(makePeriodData(), 'c1', { strength: 2.5 });

      expect(errorsFor(data)[0]).toContain('whole number');
    });
  });
});
