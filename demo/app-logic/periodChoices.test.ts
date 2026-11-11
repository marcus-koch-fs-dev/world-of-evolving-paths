import { describe, expect, it } from 'vitest';
import { toDay } from 'world-of-evolving-paths';
import { monthChoices, weekChoices, yearOfDay } from './periodChoices';

describe('Period choices', () => {
  describe('for the weeks of a year', () => {
    it('starts with calendar week 1, the one that holds 4 January', () => {
      const [first] = weekChoices(2026);

      expect(first.date).toBe('2025-12-29');
      expect(first.label).toBe('CW 1 · 29.12.');
    });

    it('has 52 weeks in a normal year and 53 in a long one', () => {
      expect(weekChoices(2026)).toHaveLength(53);
      expect(weekChoices(2027)).toHaveLength(52);
    });
  });

  describe('for the months of a year', () => {
    it('lists twelve months with the first of each as date', () => {
      const months = monthChoices(2026, 'en');

      expect(months).toHaveLength(12);
      expect(months[10]).toEqual({ date: '2026-11-01', label: 'Nov' });
    });
  });

  it('names the year of a day', () => {
    expect(yearOfDay(toDay('2026-11-11'))).toBe(2026);
  });
});
