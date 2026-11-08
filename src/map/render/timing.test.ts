import { describe, expect, it } from 'vitest';
import { approach, followShare, isApproaching } from './timing.js';

describe('Timing', () => {
  describe('when a value is far from its target', () => {
    it('moves by the share of the way', () => {
      const next = approach(0, 10, 0.5, 0.01);

      expect(next).toBe(5);
      expect(isApproaching(0, 10, 0.01)).toBe(true);
    });
  });

  describe('when a value is within the step of its target', () => {
    it('lands on the target', () => {
      const next = approach(9.999, 10, 0.5, 0.01);

      expect(next).toBe(10);
      expect(isApproaching(9.999, 10, 0.01)).toBe(false);
    });
  });

  describe('when more time has passed', () => {
    it('covers a bigger share, never more than all', () => {
      const short = followShare(16, 60);
      const long = followShare(160, 60);

      expect(long).toBeGreaterThan(short);
      expect(long).toBeLessThan(1);
    });
  });
});
