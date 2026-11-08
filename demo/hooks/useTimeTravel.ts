import { useState } from 'react';
import { fromDay, toDay } from 'world-of-evolving-paths';
import { playbackPlan, useTimePlayback } from 'world-of-evolving-paths/react';
import { playbackStartDay } from '../app-logic/timeTravel';

// Playing through any range takes about this long at normal speed
const PLAY_DURATION_MS = 24000;
export const PLAY_SPEEDS = [0.5, 1, 2];

/** Moving through time: the day, whether it plays, and the view it belongs to. It ends when the view changes. */
type Travel = { view: string; day: number; playing: boolean };

type Options = {
  /** The key of the view that is shown. */
  view: string;
  today: string;
  /** The days the slider reaches. */
  range: { start: number; end: number };
};

/** Time travel: the day the slider is on, playing through the range, and the speed. */
export function useTimeTravel({ view, today, range }: Options) {
  const [travel, setTravel] = useState<Travel | null>(null);
  const [speed, setSpeed] = useState(1);
  // Time travel only counts in the view it was started in
  const day = travel?.view === view ? travel.day : null;
  const playing = travel?.view === view && travel.playing;

  const plan = playbackPlan(range.end - range.start, PLAY_DURATION_MS / speed);
  useTimePlayback({
    playing,
    day: day ?? toDay(today),
    end: range.end,
    intervalMs: plan.intervalMs,
    stepDays: plan.stepDays,
    onDayChange: (next) => setTravel({ view, day: next, playing: true }),
    onEnd: () => setTravel((current) => (current ? { ...current, playing: false } : current)),
  });

  return {
    /** The day travelled to, or null while the real today is shown. */
    day,
    playing,
    speed,
    setSpeed,
    /** The day the map shows as today. */
    shownToday: day === null ? today : fromDay(day),
    /** The day the slider shows: the travelled day, or today kept inside the range. */
    sliderDay: day ?? Math.min(range.end, Math.max(range.start, toDay(today))),
    setDay: (next: number) => setTravel({ view, day: next, playing: false }),
    setPlaying: (next: boolean) =>
      setTravel({ view, day: playbackStartDay(day, range.start, range.end), playing: next }),
    reset: () => setTravel(null),
  };
}

export type TimeTravel = ReturnType<typeof useTimeTravel>;
