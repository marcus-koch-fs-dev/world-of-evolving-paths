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

const MIN_INTERVAL_MS = 40; // no step comes faster than this, so the map can keep up

/**
 * How fast to play so that the whole range takes durationMs: a short range gets a long wait between days,
 * a long one gets a short wait and, if needed, several days per step.
 */
export function playbackPlan(days: number, durationMs: number): { intervalMs: number; stepDays: number } {
  const safeDays = Math.max(1, days);
  const intervalMs = Math.max(MIN_INTERVAL_MS, durationMs / safeDays);
  return { intervalMs, stepDays: Math.max(1, Math.ceil((safeDays * intervalMs) / durationMs)) };
}

/** One step of playback: the next day, never past the end, and whether the end is reached. */
export function stepPlayback(day: number, end: number, stepDays: number): { day: number; finished: boolean } {
  const next = Math.min(end, day + stepDays);
  return { day: next, finished: next >= end };
}

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
      const next = stepPlayback(current, last, step);
      change(next.day);
      if (next.finished) finish();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [playing, intervalMs]);
}
