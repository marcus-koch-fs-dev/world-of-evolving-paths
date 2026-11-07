import { describe, expect, it } from 'vitest';
import { makePath, makePoint } from '../../tests/fixtures.js';
import { periodOf } from './calendar.js';
import { dateAtX, generateLayout } from './layout.js';

const week = periodOf('week', '2026-11-04');

describe('Layout edge cases', () => {
  describe('when a point id is the name of a built-in property', () => {
    it('places its child like any other point', () => {
      const points = [
        makePoint({ id: 'constructor', date: '2026-11-02', next: ['child'] }),
        makePoint({ id: 'child', date: '2026-11-05' }),
      ];

      const { positions } = generateLayout({ paths: [makePath('combat')], points, period: week, seed: 1 });

      expect(Number.isFinite(positions.child.y)).toBe(true);
    });
  });

  describe('when turning a position into a date in a view without data', () => {
    it('stays inside the period', () => {
      const date = dateAtX(700, null, week.key, '2026-11-07');

      expect(date >= '2026-11-02' && date <= '2026-11-08').toBe(true);
    });

    it('gives today for a view that is not a calendar period', () => {
      expect(dateAtX(700, null, 'free', '2026-11-07')).toBe('2026-11-07');
    });
  });
});
