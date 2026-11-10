import { describe, expect, it } from 'vitest';
import { editPoint, makePeriodData } from '../../tests/fixtures.js';
import { validatePeriodData } from './validate.js';

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

  describe('when the connections are wrong', () => {
    it('accepts a link to a point that is not in the view, because it is dropped later', () => {
      const data = editPoint(makePeriodData(), 'c1', { next: ['next-week'] });

      expect(validatePeriodData(data).ok).toBe(true);
    });

    it('rejects a circle of connections', () => {
      const circle = editPoint(editPoint(makePeriodData(), 'c1', { next: ['c2'] }), 'c2', { next: ['c1'] });

      expect(errorsFor(circle).some((message) => message.includes('circle'))).toBe(true);
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

  describe('when a point has connections that leave the view', () => {
    it('accepts incoming and outgoing leads with a title and a date', () => {
      const lead = { title: '5 pull-ups', date: '2026-03-23' };
      const data = editPoint(makePeriodData(), 'c1', { incoming: [lead], outgoing: [lead] });

      expect(validatePeriodData(data).ok).toBe(true);
    });

    it('rejects leads that are not a list', () => {
      const data = editPoint(makePeriodData(), 'c1', { outgoing: 'later' as never });

      expect(errorsFor(data)[0]).toContain('outgoing must be a list');
    });

    it('accepts the id of the point out there, and rejects an empty one', () => {
      const ok = editPoint(makePeriodData(), 'c1', { outgoing: [{ title: 'x', date: '2026-03-23', id: 'goal' }] });
      const empty = editPoint(makePeriodData(), 'c1', { outgoing: [{ title: 'x', date: '2026-03-23', id: '' }] });

      expect(validatePeriodData(ok).ok).toBe(true);
      expect(errorsFor(empty)[0]).toContain('outgoing[0].id');
    });

    it('rejects a lead without a title or with a bad date, and says which one', () => {
      const data = editPoint(makePeriodData(), 'c1', {
        incoming: [{ date: '2026-03-23' } as never, { title: 'x', date: '23.3.2026' }],
      });

      const errors = errorsFor(data);

      expect(errors[0]).toContain('incoming[0].title');
      expect(errors[1]).toContain('incoming[1].date');
    });
  });
});
