import { describe, expect, it } from 'vitest';
import { wheelFactor } from './wheel.js';

describe('Wheel zoom', () => {
  describe('when the wheel does not turn', () => {
    it('keeps the zoom', () => {
      const factor = wheelFactor(0);

      expect(factor).toBe(1);
    });
  });

  describe('when the wheel turns up and down by the same amount', () => {
    it('zooms in and out by factors that cancel', () => {
      const up = wheelFactor(-120);
      const down = wheelFactor(120);

      expect(up).toBeGreaterThan(1);
      expect(down).toBeLessThan(1);
      expect(up * down).toBeCloseTo(1);
    });
  });
});
