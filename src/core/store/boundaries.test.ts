import { describe, expect, it } from 'vitest';
import { toDay } from '../dates.js';
import { bordersBetween } from './boundaries.js';

const days = (...isos: string[]) => isos.map(toDay);

describe('Borders between two days', () => {
  describe('on the week level', () => {
    it('gives the first day of every week after the first day, up to the last day', () => {
      const borders = bordersBetween('week', toDay('2026-11-04'), toDay('2026-11-20'));

      expect(borders).toEqual(days('2026-11-09', '2026-11-16'));
    });

    it('counts a border that lies on the last day', () => {
      const borders = bordersBetween('week', toDay('2026-11-04'), toDay('2026-11-09'));

      expect(borders).toEqual(days('2026-11-09'));
    });

    it('gives nothing when both days are in the same week', () => {
      expect(bordersBetween('week', toDay('2026-11-02'), toDay('2026-11-08'))).toEqual([]);
    });
  });

  describe('on the month level', () => {
    it('takes months of different lengths, February included', () => {
      const borders = bordersBetween('month', toDay('2026-01-15'), toDay('2026-04-02'));

      expect(borders).toEqual(days('2026-02-01', '2026-03-01', '2026-04-01'));
    });
  });

  describe('on the year level', () => {
    it('takes a leap year as one period', () => {
      const borders = bordersBetween('year', toDay('2023-06-01'), toDay('2026-01-01'));

      expect(borders).toEqual(days('2024-01-01', '2025-01-01', '2026-01-01'));
    });
  });

  describe('over a very long span', () => {
    it('works without a deep recursion', () => {
      const borders = bordersBetween('week', toDay('1900-01-01'), toDay('2100-01-01'));

      expect(borders.length).toBeGreaterThan(10000);
    });
  });
});
