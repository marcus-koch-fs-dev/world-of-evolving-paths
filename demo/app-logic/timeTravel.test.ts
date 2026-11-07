import { describe, expect, it } from 'vitest';
import { playbackStartDay } from './timeTravel';

describe('Time travel', () => {
  describe('when starting playback', () => {
    it('starts at the beginning when nothing was chosen', () => {
      expect(playbackStartDay(null, 100, 200)).toBe(100);
    });

    it('continues from where the slider is', () => {
      expect(playbackStartDay(150, 100, 200)).toBe(150);
    });

    it('starts over when the slider is already at the end', () => {
      expect(playbackStartDay(200, 100, 200)).toBe(100);
    });
  });
});
