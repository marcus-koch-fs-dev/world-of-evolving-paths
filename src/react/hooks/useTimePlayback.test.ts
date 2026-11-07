import { describe, expect, it } from 'vitest';
import { playbackPlan, stepPlayback } from './useTimePlayback.js';

describe('Time playback', () => {
  describe('when stepping forward', () => {
    it('moves by the step', () => {
      expect(stepPlayback(10, 100, 3)).toEqual({ day: 13, finished: false });
    });

    it('stops exactly at the end and says so', () => {
      expect(stepPlayback(99, 100, 5)).toEqual({ day: 100, finished: true });
    });

    it('stays at the end when it is already there', () => {
      expect(stepPlayback(100, 100, 1)).toEqual({ day: 100, finished: true });
    });
  });

  describe('when planning how fast to play', () => {
    it('waits long between days in a short range', () => {
      expect(playbackPlan(7, 21000)).toEqual({ intervalMs: 3000, stepDays: 1 });
    });

    it('takes a year in the same time with short waits', () => {
      const { intervalMs, stepDays } = playbackPlan(365, 21900);

      expect(intervalMs).toBeCloseTo(60);
      expect(stepDays).toBe(1);
    });

    it('skips days when a range is too long for one day per step', () => {
      const { intervalMs, stepDays } = playbackPlan(2000, 20000);

      expect(intervalMs).toBe(40);
      expect(stepDays).toBe(4);
    });

    it('copes with an empty range', () => {
      expect(playbackPlan(0, 20000).stepDays).toBe(1);
    });
  });
});
