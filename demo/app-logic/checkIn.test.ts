import { describe, expect, it } from 'vitest';
import { fromDay, toDay } from 'world-of-evolving-paths';
import { checkInMessage, hasCheckedIn } from './checkIn';
import type { CheckIn } from './types';

const TODAY = '2026-11-10';
const GYM = { id: 'gym', name: 'Gym' };

/** One check-in on each of the `count` days before today. */
const daysBefore = (count: number, pathId = GYM.id): CheckIn[] =>
  Array.from({ length: count }, (_, i) => ({ pathId, date: fromDay(toDay(TODAY) - 1 - i) }));

describe('Check-in', () => {
  describe('hasCheckedIn', () => {
    it('is true only for the same path on the same day', () => {
      const checkIns = [{ pathId: 'gym', date: TODAY }];
      expect(hasCheckedIn(checkIns, 'gym', TODAY)).toBe(true);
      expect(hasCheckedIn(checkIns, 'reading', TODAY)).toBe(false);
      expect(hasCheckedIn(checkIns, 'gym', '2026-11-09')).toBe(false);
    });
  });

  describe('checkInMessage', () => {
    it('counts the days up and names what the next tier still needs', () => {
      expect(checkInMessage(daysBefore(20), GYM, TODAY)).toBe(
        'Gym: 20 → 21 active days in 12 weeks · Road. 19 more to Expressway.',
      );
    });

    it('celebrates when the check-in reaches a new tier', () => {
      expect(checkInMessage(daysBefore(69), GYM, TODAY)).toBe('Gym is now a Highway! 69 → 70 active days in 12 weeks.');
    });

    it('says when the strongest tier is already reached', () => {
      expect(checkInMessage(daysBefore(80), GYM, TODAY)).toBe(
        'Gym: 80 → 81 active days in 12 weeks · Highway, the strongest tier.',
      );
    });

    it('does not count a second check-in on the same day', () => {
      const checkIns = [...daysBefore(5), { pathId: GYM.id, date: TODAY }];
      expect(checkInMessage(checkIns, GYM, TODAY)).toBe('Gym: already checked in today · 6 active days in 12 weeks.');
    });

    it('ignores the check-ins of other paths and days outside the window', () => {
      const old = { pathId: GYM.id, date: '2026-01-01' };
      expect(checkInMessage([...daysBefore(3, 'reading'), old], GYM, TODAY)).toBe(
        'Gym: 0 → 1 active days in 12 weeks · Desire path. 5 more to Path.',
      );
    });
  });
});
