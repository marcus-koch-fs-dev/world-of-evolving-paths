import { fromDay } from '../dates.js';
import { dayAtX, tileWidth, xOfBorder, xOfDate } from '../timeAxis.js';
import type { PlacedWorld } from '../types.js';

/** The date that lies at a position along the time axis of a view with a period, or null in the overview. */
export function dateAtAxisX(world: PlacedWorld, x: number): string | null {
  const { period } = world;
  return period ? fromDay(dayAtX(x, period, tileWidth(world.points))) : null;
}

/**
 * Where a date lies along the time axis of the view. The overview has no axis: its points are where the user put
 * them, so there is nothing to spread over and the answer is null.
 */
export function dateAxisX(world: PlacedWorld, iso: string): number | null {
  const { period } = world;
  return period ? xOfDate(iso, period, tileWidth(world.points)) : null;
}

/** Where today lies along the time axis of a view with a period, or null in the overview. */
export function todayAxisX(world: PlacedWorld): number | null {
  const { period } = world;
  return period ? xOfDate(world.today, period, tileWidth(world.points)) : null;
}

/**
 * Where the borders of the period lie along the time axis: the left and the right edge of the view in the layout. The
 * arrows of the lines that come from or go to points outside the view stand there. Null in the overview.
 */
export function viewEdges(world: PlacedWorld): { left: number; right: number } | null {
  const { period } = world;
  if (!period) return null;
  const width = tileWidth(world.points);
  return { left: xOfBorder(period.start, period, width), right: xOfBorder(period.end + 1, period, width) };
}
