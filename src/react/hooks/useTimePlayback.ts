import { useEffect, useRef } from 'react';

const DEFAULT_INTERVAL_MS = 120;

type Options = {
  playing: boolean;
  /** The day the slider is on. */
  day: number;
  /** Playback stops here. */
  end: number;
  onDayChange: (day: number) => void;
  /** Playback reached the end. Usually the app sets `playing` to false. */
  onEnd: () => void;
  /** Time between two steps. */
  intervalMs?: number;
  /** Days per step. Default 1. */
  stepDays?: number;
};

/** Moves the day forward while `playing` is true, one step per interval, and stops at `end`. */
export function useTimePlayback({
  playing,
  day,
  end,
  onDayChange,
  onEnd,
  intervalMs = DEFAULT_INTERVAL_MS,
  stepDays = 1,
}: Options): void {
  const latest = useRef({ day, end, onDayChange, onEnd, stepDays });
  latest.current = { day, end, onDayChange, onEnd, stepDays };

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      const { day: current, end: last, onDayChange: change, onEnd: finish, stepDays: step } = latest.current;
      const next = Math.min(last, current + step);
      change(next);
      if (next >= last) finish();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [playing, intervalMs]);
}
