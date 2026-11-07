import { describe, expect, it } from 'vitest';
import { makePeriodData } from '../../tests/fixtures';
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

    it('rejects missing points', () => {
      expect(errorsFor({ paths: [] })[0]).toContain('`points` must be a list');
    });
  });

  describe('when a point is wrong', () => {
    it('names the point and the date problem', () => {
      const data = makePeriodData();
      data.points[0] = { ...data.points[0], date: '2026-02-30' };

      expect(errorsFor(data)).toContain('points[0].date must be a valid YYYY-MM-DD date.');
    });

    it('rejects an importance outside 1 to 5', () => {
      const data = makePeriodData();
      data.points[0] = { ...data.points[0], importance: 9 };

      expect(errorsFor(data)[0]).toContain('importance');
    });

    it('rejects a pin with only one coordinate', () => {
      const data = makePeriodData();
      data.points[0] = { ...data.points[0], x: 10 };

      expect(errorsFor(data)[0]).toContain('both x and y');
    });
  });

  describe('when ids do not fit together', () => {
    it('rejects a duplicate point id', () => {
      const data = makePeriodData();
      data.points[1] = { ...data.points[1], id: data.points[0].id };

      expect(errorsFor(data)[0]).toContain('used twice');
    });

    it('rejects a point on an unknown path', () => {
      const data = makePeriodData();
      data.points[0] = { ...data.points[0], pathId: 'nowhere' };

      expect(errorsFor(data)[0]).toContain('unknown path "nowhere"');
    });
  });
});
