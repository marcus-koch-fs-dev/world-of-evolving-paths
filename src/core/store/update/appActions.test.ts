import { describe, expect, it } from 'vitest';
import { fromDay, toDay } from '../../dates.js';
import { createStore } from '../levels.js';
import type { Store, StorePath, StorePoint } from '../types.js';
import { validateStore } from '../validate.js';
import { checkIn, checkInDays, checkInStatus, hasCheckedIn, undoCheckIn } from './checkIns.js';
import { addNextPoint, setStatus } from './quick.js';

const point = (id: string, date: string): StorePoint => ({
  id,
  date,
  title: id,
  kind: 'milestone',
  status: 'open',
  prio: 3,
});

const path = (id: string, extra: Partial<StorePath> = {}): StorePath => ({
  id,
  name: id,
  color: '#3a86ff',
  branches: [
    { id: `${id}-main`, points: [point(`${id}1`, '2026-11-02')] },
    { id: `${id}-fork`, points: [point(`${id}2`, '2026-11-05')], splitsAt: `${id}1` },
  ],
  ...extra,
});

const twoPaths = (): Store => createStore([path('a'), path('b')]);
const path0 = (): StorePath => path('a');

/** The check-in dates of a path in a store. */
const checkInsOf = (store: Store, id: string) => store.paths.find((p) => p.id === id)?.checkIns;

describe('Check-ins', () => {
  describe('checkIn', () => {
    it('puts the day into the path and leaves the other path alone', () => {
      const before = twoPaths();

      const after = checkIn(before, 'a', '2026-11-13');

      expect(checkInsOf(after, 'a')).toEqual(['2026-11-13']);
      expect(after.paths[1]).toBe(before.paths[1]);
    });

    it('keeps the days in time order', () => {
      const store = checkIn(checkIn(twoPaths(), 'a', '2026-11-13'), 'a', '2026-11-02');

      expect(checkInsOf(store, 'a')).toEqual(['2026-11-02', '2026-11-13']);
    });

    it('does not count twice on one day and returns the same store', () => {
      const once = checkIn(twoPaths(), 'a', '2026-11-13');

      expect(checkIn(once, 'a', '2026-11-13')).toBe(once);
    });

    it('changes nothing for a path that does not exist', () => {
      const before = twoPaths();

      expect(checkIn(before, 'nope', '2026-11-13')).toBe(before);
    });

    it('ignores a date that is not valid, so later reads cannot fail', () => {
      const before = twoPaths();

      expect(checkIn(before, 'a', '2026-02-30')).toBe(before);
      expect(checkIn(before, 'a', 'tomorrow')).toBe(before);
    });
  });

  describe('undoCheckIn', () => {
    it('takes the day back', () => {
      const store = undoCheckIn(checkIn(twoPaths(), 'a', '2026-11-13'), 'a', '2026-11-13');

      expect(hasCheckedIn(store.paths[0], '2026-11-13')).toBe(false);
    });

    it('changes nothing when there was no check-in', () => {
      const before = twoPaths();

      expect(undoCheckIn(before, 'a', '2026-11-13')).toBe(before);
    });
  });

  it('skips a stored date that is not valid when it lists the days', () => {
    const path = { ...path0(), checkIns: ['2026-11-13', 'broken'] };

    expect(checkInDays(path)).toEqual([toDay('2026-11-13')]);
    expect(validateStore([path])).toEqual(['Path "a" has a check-in with no valid date (YYYY-MM-DD): "broken".']);
  });

  it('lists the days of a path as day numbers', () => {
    const store = checkIn(twoPaths(), 'a', '2026-11-13');

    expect(checkInDays(store.paths[0])).toEqual([toDay('2026-11-13')]);
  });

  describe('checkInStatus', () => {
    /** A path with a check-in on each of the `count` days before 2026-11-13. */
    const walked = (count: number): StorePath =>
      path('a', {
        checkIns: Array.from({ length: count }, (_, i) => fromDay(toDay('2026-11-13') - 1 - i)).sort(),
      });

    it('counts the check-in as one more active day', () => {
      const status = checkInStatus(walked(3), '2026-11-13');

      expect(status).toMatchObject({ checkedIn: false, activeBefore: 3, activeAfter: 4 });
    });

    it('does not add a day that was already checked in', () => {
      const store = checkIn(createStore([walked(3)]), 'a', '2026-11-13');

      const status = checkInStatus(store.paths[0], '2026-11-13');

      expect(status).toMatchObject({ checkedIn: true, activeBefore: 3, activeAfter: 4 });
    });

    it('reports a step up to a stronger tier', () => {
      // Six active days make a Path, so the fifth check-in is not enough but the sixth is
      expect(checkInStatus(walked(4), '2026-11-13').tierUp).toBe(false);
      expect(checkInStatus(walked(5), '2026-11-13')).toMatchObject({ tierUp: true, tierName: 'Path' });
    });

    it('says how many days the next tier still needs', () => {
      const { next } = checkInStatus(walked(5), '2026-11-13');

      expect(next).toEqual({ name: 'Road', daysMissing: 12 });
    });

    it('has no next tier at the strongest tier', () => {
      expect(checkInStatus(walked(80), '2026-11-13').next).toBeUndefined();
    });
  });
});

describe('addNextPoint', () => {
  it('adds a point to the end of the main branch with defaults', () => {
    const store = addNextPoint(twoPaths(), 'a', { title: 'Muscle-up' }, '2026-11-13');

    const added = store.paths[0].branches[0].points.at(-1);
    expect(added).toMatchObject({
      title: 'Muscle-up',
      date: '2026-11-13',
      kind: 'milestone',
      status: 'open',
      prio: 3,
    });
    expect(store.paths[0].branches[1].points).toHaveLength(1);
  });

  it('takes what the app gives instead of the defaults', () => {
    const store = addNextPoint(
      twoPaths(),
      'a',
      { title: 'Goal', date: '2027-01-01', kind: 'goal', prio: 5, status: 'current', note: 'Big', id: 'mine' },
      '2026-11-13',
    );

    expect(store.paths[0].branches[0].points.at(-1)).toEqual({
      id: 'mine',
      date: '2027-01-01',
      title: 'Goal',
      kind: 'goal',
      status: 'current',
      prio: 5,
      note: 'Big',
    });
  });

  it('makes a different id each time, so the data stays valid', () => {
    const store = addNextPoint(addNextPoint(twoPaths(), 'a', { title: 'One' }), 'a', { title: 'Two' });

    expect(validateStore(store.paths)).toEqual([]);
  });

  it('changes nothing for a path that does not exist', () => {
    const before = twoPaths();

    expect(addNextPoint(before, 'nope', { title: 'x' })).toBe(before);
  });
});

describe('setStatus', () => {
  it('ticks a point off and leaves the other path alone', () => {
    const before = twoPaths();

    const after = setStatus(before, 'a1', 'done');

    expect(after.paths[0].branches[0].points[0].status).toBe('done');
    expect(after.paths[1]).toBe(before.paths[1]);
  });
});
