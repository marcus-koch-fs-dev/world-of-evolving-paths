import { describe, expect, it } from 'vitest';
import { heightBetween } from './edgeHeight';

describe('Height where a connection crosses the edge of a period', () => {
  it('lies on the straight line between the heights of the two points', () => {
    expect(heightBetween({ day: 0, height: 0 }, { day: 10, height: 100 }, 3)).toBe(30);
  });

  it('counts a point without a height as on its lane', () => {
    expect(heightBetween({ day: 0 }, { day: 10, height: 100 }, 5)).toBe(50);
  });

  it('leaves the line to the map when neither point has a height', () => {
    expect(heightBetween({ day: 0 }, { day: 10 }, 5)).toBeUndefined();
  });

  it('stays between the two points for a day outside them', () => {
    expect(heightBetween({ day: 0, height: 20 }, { day: 10, height: 40 }, 99)).toBe(40);
  });

  it('gives the same height for a week and a month edge on the same day', () => {
    const from = { day: 100, height: -60 };
    const to = { day: 140, height: 60 };

    expect(heightBetween(from, to, 120)).toBe(0);
  });
});
