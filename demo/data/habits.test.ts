import { describe, expect, it } from 'vitest';
import { periodOf, toDay, type ViewLevel, validatePeriodData } from 'world-of-evolving-paths';
import { buildPeriodData } from '../app-logic/periodData';
import { createHabits } from './habits';

const TODAY = '2026-11-08';
const LEVELS: ViewLevel[] = ['day', 'week', 'month', 'halfYear', 'year'];

describe('Demo habits', () => {
  describe('when the data is created for a day', () => {
    it('has six paths, each with a start and a goal', () => {
      const { paths, points } = createHabits(TODAY);

      expect(paths).toHaveLength(6);
      paths.forEach((path) => {
        const own = points.filter((point) => point.pathId === path.id);
        expect(own.some((point) => point.kind === 'start')).toBe(true);
        expect(own.some((point) => point.kind === 'goal')).toBe(true);
      });
    });

    it('has unique ids and only links to points that exist', () => {
      const { points } = createHabits(TODAY);
      const ids = new Set(points.map((point) => point.id));

      expect(ids.size).toBe(points.length);
      points.forEach((point) => {
        point.next.forEach((id) => {
          expect(ids.has(id)).toBe(true);
        });
      });
    });

    it('has exactly one current point on every main chain', () => {
      const { paths, points } = createHabits(TODAY);

      paths.forEach((path) => {
        const current = points.filter((point) => point.pathId === path.id && point.status === 'current');
        expect(current).toHaveLength(1);
      });
    });
  });

  describe('when the check-ins are created', () => {
    it('has none in the future and none before a path started', () => {
      const { points, checkIns } = createHabits(TODAY);
      const today = toDay(TODAY);

      checkIns.forEach((checkIn) => {
        const start = Math.min(...points.filter((point) => point.pathId === checkIn.pathId).map((p) => toDay(p.date)));
        expect(toDay(checkIn.date)).toBeLessThanOrEqual(today);
        expect(toDay(checkIn.date)).toBeGreaterThanOrEqual(start);
      });
    });
  });

  describe('when every view of the year is built', () => {
    it.each(LEVELS)('gives valid data with two paths per page in the %s view', (level) => {
      const { paths, points, checkIns } = createHabits(TODAY);
      const period = periodOf(level, TODAY);

      const view = buildPeriodData({ paths, points, checkIns, period, page: 0, pins: {} });

      expect(validatePeriodData(view.data).ok).toBe(true);
      expect(view.data.paths.length).toBeLessThanOrEqual(2);
      expect(view.pages).toBeGreaterThanOrEqual(1);
    });

    it('gives the year three pages with milestones only', () => {
      const { paths, points, checkIns } = createHabits(TODAY);

      const year = buildPeriodData({ paths, points, checkIns, period: periodOf('year', TODAY), page: 0, pins: {} });
      const week = buildPeriodData({ paths, points, checkIns, period: periodOf('week', TODAY), page: 0, pins: {} });
      const count = (data: typeof year.data) => data.paths.flatMap((path) => path.points).length;

      expect(year.pages).toBe(3);
      expect(count(year.data)).toBeGreaterThan(0);
      expect(count(year.data)).toBeLessThan(count(week.data) + 30);
    });
  });

  describe('when the demo is opened early in the year', () => {
    it('still builds valid data, with most points still ahead', () => {
      const { points } = createHabits('2027-01-10');

      expect(points.filter((point) => point.status === 'open').length).toBeGreaterThan(points.length / 2);
    });
  });
});
