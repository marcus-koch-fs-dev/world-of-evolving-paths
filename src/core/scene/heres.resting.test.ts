import { describe, expect, it } from 'vitest';
import { makePoint } from '../../../tests/fixtures.js';
import { toDay } from '../dates.js';
import type { PlacedPoint } from '../types.js';
import { leadFraction, restingPoint } from './heres.js';

function placed(overrides: Partial<PlacedPoint> & { id: string }): PlacedPoint {
  const { x: _x, y: _y, ...rest } = makePoint(overrides);
  return { ...rest, x: 0, y: 0 };
}

const today = toDay('2026-11-11');

describe('Place of today on a line that leaves the view', () => {
  const day = toDay;

  it('counts from the point along an outgoing line', () => {
    expect(leadFraction('after', day('2026-11-01'), day('2026-11-21'), today)).toBeCloseTo(0.5);
  });

  it('counts from the point backwards along an incoming line', () => {
    expect(leadFraction('before', day('2026-11-21'), day('2026-11-01'), today)).toBeCloseTo(0.5);
  });

  it('is none when today is not between the two dates', () => {
    expect(leadFraction('after', day('2026-11-15'), day('2026-11-21'), today)).toBeNull();
    expect(leadFraction('before', day('2026-11-05'), day('2026-10-01'), today)).toBeNull();
  });
});

describe('Point that the Today marker rests on', () => {
  describe('when the path has points before and after today', () => {
    it('is the last point already reached', () => {
      const points = [
        placed({ id: 'late', date: '2026-11-25' }),
        placed({ id: 'early', date: '2026-11-03' }),
        placed({ id: 'middle', date: '2026-11-09' }),
      ];

      expect(restingPoint(points, today)?.id).toBe('middle');
    });
  });

  describe('when all points are ahead', () => {
    it('is the first point, whose lane the path starts on', () => {
      const points = [placed({ id: 'b', date: '2026-11-25' }), placed({ id: 'a', date: '2026-11-20' })];

      expect(restingPoint(points, today)?.id).toBe('a');
    });
  });

  describe('when the path has no points', () => {
    it('is none', () => {
      expect(restingPoint([], today)).toBeUndefined();
    });
  });
});
