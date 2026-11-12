import { describe, expect, it } from 'vitest';
import { createBranchOf, leadsTo } from './reach';

const points = [
  { id: 'p', next: ['x', 'y'] },
  { id: 'x', next: ['hidden'] },
  { id: 'hidden', next: ['a'] },
  { id: 'a', next: [] },
  { id: 'y', next: ['b'] },
  { id: 'b', next: [] },
];

describe('Reach along the connections', () => {
  describe('when following the connections', () => {
    it('finds a point across other points, and not one on another branch', () => {
      const nextOf = new Map(points.map((point) => [point.id, point.next]));

      expect(leadsTo(nextOf, 'x', 'a')).toBe(true);
      expect(leadsTo(nextOf, 'x', 'b')).toBe(false);
    });
  });

  describe('when a line leaves a point that forks', () => {
    const branchOf = createBranchOf(points);

    it('gives each branch its own number', () => {
      expect(branchOf('p', 'a')).toBe(0);
      expect(branchOf('p', 'b')).toBe(1);
    });

    it('gives the same number whether the point at the end is the next one or lies behind hidden points', () => {
      expect(branchOf('p', 'x')).toBe(branchOf('p', 'a'));
    });

    it('is the first branch for a point that is not known', () => {
      expect(branchOf('nobody', 'a')).toBe(0);
    });
  });
});
