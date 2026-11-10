import { describe, expect, it } from 'vitest';
import { popStep, pushStep } from './viewTrail';

describe('View trail', () => {
  describe('when a step is added', () => {
    it('goes on top and leaves the trail it was given alone', () => {
      const trail = ['year'];

      expect(pushStep(trail, 'month')).toEqual(['year', 'month']);
      expect(trail).toEqual(['year']);
    });

    it('forgets the oldest steps beyond the limit', () => {
      expect(pushStep(['a', 'b'], 'c', 2)).toEqual(['b', 'c']);
    });
  });

  describe('when a step is taken', () => {
    it('gives the last step and the rest', () => {
      expect(popStep(['year', 'month'])).toEqual({ step: 'month', rest: ['year'] });
    });

    it('gives no step on an empty trail', () => {
      expect(popStep([])).toEqual({ step: null, rest: [] });
    });
  });
});
