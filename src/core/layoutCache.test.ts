import { describe, expect, it } from 'vitest';
import { makePeriodData } from '../../tests/fixtures.js';
import { periodOf } from './calendar.js';
import { layoutPeriod } from './layout.js';
import { reuseLayout } from './layoutCache.js';

describe('Reused layout', () => {
  it('keeps the positions and the period of the earlier layout', () => {
    const week = periodOf('week', '2026-11-04');
    const earlier = layoutPeriod(makePeriodData(), week.key, 1);

    const reused = reuseLayout(makePeriodData(), earlier);

    expect(reused.positions).toBe(earlier.positions);
    expect(reused.period).toEqual({ start: week.start, end: week.end });
  });
});
