import { describe, expect, it } from 'vitest';
import { fromDay, type StorePath, toDay } from 'world-of-evolving-paths';
import { checkInMessage } from './checkIn';

const TODAY = '2026-11-10';

/** The gym path with one check-in on each of the `count` days before today, plus `extra` days. */
const gym = (count: number, extra: string[] = []): StorePath => ({
  id: 'gym',
  name: 'Gym',
  color: '#3a86ff',
  branches: [],
  checkIns: [...Array.from({ length: count }, (_, i) => fromDay(toDay(TODAY) - 1 - i)), ...extra].sort(),
});

describe('checkInMessage', () => {
  it('counts the days up and names what the next tier still needs', () => {
    expect(checkInMessage(gym(20), TODAY)).toBe('Gym: 20 → 21 active days in 12 weeks · Road. 19 more to Expressway.');
  });

  it('celebrates when the check-in reaches a new tier', () => {
    expect(checkInMessage(gym(69), TODAY)).toBe('Gym is now a Highway! 69 → 70 active days in 12 weeks.');
  });

  it('says when the strongest tier is already reached', () => {
    expect(checkInMessage(gym(80), TODAY)).toBe('Gym: 80 → 81 active days in 12 weeks · Highway, the strongest tier.');
  });

  it('does not count a second check-in on the same day', () => {
    expect(checkInMessage(gym(5, [TODAY]), TODAY)).toBe('Gym: already checked in today · 6 active days in 12 weeks.');
  });

  it('ignores days outside the window', () => {
    expect(checkInMessage(gym(0, ['2026-01-01']), TODAY)).toBe(
      'Gym: 0 → 1 active day in 12 weeks · Desire path. 5 more to Path.',
    );
  });

  it('uses the singular for one week', () => {
    const oneWeek = { weeks: 1, minActiveDays: [0, 2] };
    expect(checkInMessage(gym(0), TODAY, oneWeek)).toBe(
      'Gym: 0 → 1 active day in 1 week · Desire path. 1 more to Path.',
    );
  });
});
