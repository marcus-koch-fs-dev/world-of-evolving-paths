import { describe, expect, it } from 'vitest';
import { periodOf, toDay } from 'world-of-evolving-paths';
import { playbackStartDay, viewRange } from './timeTravel';

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

  describe('when asking for the days the slider reaches', () => {
    it('uses the shown period', () => {
      const period = periodOf('week', '2026-03-04');

      const range = viewRange(period, ['2020-01-01'], '2026-03-04');

      expect(range).toEqual({ start: period.start, end: period.end });
    });

    it('spans all points in the free view', () => {
      const range = viewRange(null, ['2026-02-01', '2026-01-01', '2026-03-01'], '2026-03-04');

      expect(range).toEqual({ start: toDay('2026-01-01'), end: toDay('2026-03-01') });
    });

    it('is just today in the free view without points', () => {
      const range = viewRange(null, [], '2026-03-04');

      expect(range).toEqual({ start: toDay('2026-03-04'), end: toDay('2026-03-04') });
    });
  });
});
