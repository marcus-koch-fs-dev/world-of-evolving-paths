import { describe, expect, it } from 'vitest';
import { keptHeights, shiftedHeights } from './shiftPath';

describe('Kept heights', () => {
  it('gives the known heights of the points, and leaves out the others', () => {
    expect(keptHeights(['a', 'missing'], { a: 7, b: 8 })).toEqual({ a: 7 });
  });
});

describe('Heights of a moved path', () => {
  const offsets = { a: 10, b: -20, c: 5, other: 40 };

  describe('when a path is moved by a distance', () => {
    it('adds the distance to every point of the path', () => {
      expect(shiftedHeights(['a', 'b'], [], offsets, -30)).toEqual({ a: -20, b: -50 });
    });

    it('leaves the other points of the view where they are', () => {
      expect(shiftedHeights(['a'], ['other'], offsets, 15)).toEqual({ a: 25, other: 40 });
    });

    it('moves a follower that is on the path itself', () => {
      expect(shiftedHeights(['a', 'c'], ['c'], offsets, 15)).toEqual({ a: 25, c: 20 });
    });
  });

  describe('when a point has no known height', () => {
    it('leaves it out', () => {
      expect(shiftedHeights(['a', 'missing'], ['gone'], offsets, 5)).toEqual({ a: 15 });
    });
  });
});
