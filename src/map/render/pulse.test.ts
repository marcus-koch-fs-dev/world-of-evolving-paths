import { describe, expect, it } from 'vitest';
import { HERE_ON_POINT_PULSE, HERE_PULSE, NODE_PULSE, pulseRing } from './pulse.js';

const createRing = () => {
  const ring = { alpha: 0, scaled: 0, scale: { set: (value: number) => (ring.scaled = value) } };
  return ring;
};

describe('Pulse', () => {
  describe('when the pulse starts', () => {
    it('shows the ring at its own size, fully visible', () => {
      const ring = createRing();

      pulseRing(ring, 0, NODE_PULSE);

      expect(ring.scaled).toBe(1);
      expect(ring.alpha).toBe(NODE_PULSE.alpha);
    });
  });

  describe('when the pulse ends', () => {
    it('has grown by the growth of its style and is gone', () => {
      const ring = createRing();

      pulseRing(ring, 1, HERE_ON_POINT_PULSE);

      expect(ring.scaled).toBeCloseTo(1 + HERE_ON_POINT_PULSE.growth);
      expect(ring.alpha).toBe(0);
    });
  });

  describe('when comparing the rings', () => {
    it('lets the Today ring on a point grow half as far as the one in free space', () => {
      expect(HERE_ON_POINT_PULSE.growth).toBe(HERE_PULSE.growth / 2);
    });
  });
});

describe('Ring on points', () => {
  describe('when comparing it with the Today ring on a point', () => {
    it('grows exactly as far, so both look the same', () => {
      expect(NODE_PULSE.growth).toBe(HERE_ON_POINT_PULSE.growth);
    });
  });
});
