import { describe, expect, it } from 'vitest';
import { makePath, makePoint, nest } from '../../../tests/fixtures.js';
import { periodOf } from '../calendar.js';
import { toDay } from '../dates.js';
import { placePeriod } from '../layout.js';
import { dateAxisX, todayAxisX } from './viewEdges.js';

describe('Date along the time axis', () => {
  const week = periodOf('week', '2026-11-04');
  const data = nest(
    [makePath('combat')],
    [makePoint({ id: 'a', date: '2026-11-03', next: ['b'] }), makePoint({ id: 'b', date: '2026-11-06' })],
  );
  const world = placePeriod(data, week.key, '2026-11-04', 1);

  it('is where the layout puts a point with that date', () => {
    const a = world.points.find((point) => point.id === 'a');

    expect(dateAxisX(world, '2026-11-03')).toBeCloseTo(a?.x ?? Number.NaN, -1);
  });

  it('grows with the date', () => {
    expect(dateAxisX(world, '2026-11-06') ?? 0).toBeGreaterThan(dateAxisX(world, '2026-11-03') ?? 0);
  });

  it('puts today on the same axis as a date', () => {
    expect(todayAxisX(world)).toBe(dateAxisX(world, '2026-11-04'));
  });

  it('spreads a free view over the days of its points', () => {
    const free = { ...world, period: null };

    expect(dateAxisX(free, '2026-11-03')).toBeLessThan(dateAxisX(free, '2026-11-06') ?? 0);
    expect(toDay('2026-11-03')).toBeLessThan(toDay('2026-11-06'));
  });

  it('has no place without a period and without points', () => {
    expect(dateAxisX({ today: '2026-11-04', period: null, paths: [], points: [] }, '2026-11-04')).toBeNull();
  });
});
