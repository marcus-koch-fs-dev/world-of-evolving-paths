import { describe, expect, it } from 'vitest';
import { followersOf } from './followers';

const point = (id: string, ...next: string[]) => ({ id, next });

describe('Followers of a point', () => {
  it('are everything it leads to, and what that leads to', () => {
    const points = [point('a', 'b'), point('b', 'c'), point('c'), point('x')];

    expect(followersOf(points, 'a').sort()).toEqual(['b', 'c']);
  });

  it('include every branch of a fork, once', () => {
    const points = [point('a', 'b', 'c'), point('b', 'd'), point('c', 'd'), point('d')];

    expect(followersOf(points, 'a').sort()).toEqual(['b', 'c', 'd']);
  });

  it('are none for the last point or an unknown one', () => {
    const points = [point('a', 'b'), point('b')];

    expect(followersOf(points, 'b')).toEqual([]);
    expect(followersOf(points, 'zzz')).toEqual([]);
  });

  it('leave out the points before it', () => {
    const points = [point('a', 'b'), point('b', 'c'), point('c')];

    expect(followersOf(points, 'b')).toEqual(['c']);
  });
});
