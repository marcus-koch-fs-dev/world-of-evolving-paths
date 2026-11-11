import { fromDay, toDay } from '../dates.js';
import { dayAtX, tileWidth, xOfDate } from '../timeAxis.js';
import type { PlacedWorld } from '../types.js';

/** The date that lies at a position along the time axis of a view with a period, or null in a free view. */
export function dateAtAxisX(world: PlacedWorld, x: number): string | null {
  const { period } = world;
  return period ? fromDay(dayAtX(x, period, tileWidth(world.points))) : null;
}

/**
 * Where a date lies along the time axis of the view, as the layout places it. A free view spreads its points over the
 * days they lie in. Null when there is nothing to spread over.
 */
export function dateAxisX(world: PlacedWorld, iso: string): number | null {
  const days = world.points.map((point) => toDay(point.date));
  const span = world.period ?? (days.length === 0 ? null : { start: Math.min(...days), end: Math.max(...days) });
  return span ? xOfDate(iso, span, tileWidth(world.points)) : null;
}

/** Where today lies along the time axis of a view with a period, or null in a free view. */
export function todayAxisX(world: PlacedWorld): number | null {
  const { period } = world;
  return period ? xOfDate(world.today, period, tileWidth(world.points)) : null;
}

/**
 * Where the first and the last day of the period lie along the time axis: the left and right edge of the view in
 * the layout. Lines that come from or go to points outside the view run up to there. Null in a free view.
 */
export function viewEdges(world: PlacedWorld): { left: number; right: number } | null {
  const { period } = world;
  if (!period) return null;
  const width = tileWidth(world.points);
  return {
    left: xOfDate(fromDay(period.start), period, width),
    right: xOfDate(fromDay(period.end), period, width),
  };
}
