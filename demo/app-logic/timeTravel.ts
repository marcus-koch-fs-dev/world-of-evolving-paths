import { type Period, toDay } from 'world-of-evolving-paths';

/** The day playback starts from: the beginning when nothing was chosen or the slider is at the end, else where it is. */
export function playbackStartDay(day: number | null, start: number, end: number): number {
  return day === null || day >= end ? start : day;
}

/**
 * The days the time slider reaches: the shown period, or in the free view everything the points span.
 * Without a period and without points it is just today, so the slider never gets broken limits.
 */
export function viewRange(period: Period | null, pointDates: readonly string[], today: string) {
  if (period) return { start: period.start, end: period.end };
  const days = pointDates.map(toDay);
  if (days.length === 0) return { start: toDay(today), end: toDay(today) };
  return { start: Math.min(...days), end: Math.max(...days) };
}
