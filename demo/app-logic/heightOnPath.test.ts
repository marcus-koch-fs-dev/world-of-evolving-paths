import { describe, expect, it } from 'vitest';
import { heightOnPath } from './heightOnPath';

describe('Height on a path', () => {
  it('is the distance from the lane of the path', () => {
    expect(heightOnPath(-80, { gym: -100, reading: 100 }, 'gym')).toBe(20);
    expect(heightOnPath(130, { gym: -100, reading: 100 }, 'reading')).toBe(30);
  });

  it('is null when the path has no lane in this view, instead of a guess', () => {
    expect(heightOnPath(300, { reading: 100 }, 'gym')).toBeNull();
  });

  it('is a whole number', () => {
    expect(heightOnPath(10.6, { gym: 0 }, 'gym')).toBe(11);
  });
});
