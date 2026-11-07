import { describe, expect, it } from 'vitest';
import { stepPlayback } from './useTimePlayback';

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
});
