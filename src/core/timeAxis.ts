import { periodFromKey } from './calendar.js';
import { fromDay, toDay } from './dates.js';
import { flattenPeriod } from './flatten.js';
import type { FlatPoint, PeriodData } from './types.js';

/** First and last day number of a stretch of time. */
export type Span = { start: number; end: number };

const SPACING = 200; // room per point along a path
const MIN_WIDTH = 2200; // no tile gets narrower than this
const EDGE_PADDING = 60;

/** Width of a tile: grows with the busiest path. */
export function tileWidth(points: FlatPoint[]): number {
  const perPath = points.reduce(
    (counts, point) => counts.set(point.pathId, (counts.get(point.pathId) ?? 0) + 1),
    new Map<string, number>(),
  );
  return Math.max(MIN_WIDTH, Math.max(0, ...perPath.values()) * SPACING);
}

/** Horizontal position of a date inside a span of a given tile width. */
export function xOfDate(iso: string, span: Span, width: number): number {
  const days = span.end - span.start + 1;
  const fraction = Math.min(1, Math.max(0, (toDay(iso) - span.start + 0.5) / days));
  return EDGE_PADDING + fraction * (width - 2 * EDGE_PADDING);
}

/** Day at a horizontal position, the inverse of how the layout spreads dates. */
export function dayAtX(x: number, span: Span, width: number): number {
  const fraction = (x - EDGE_PADDING) / (width - 2 * EDGE_PADDING);
  const days = span.end - span.start + 1;
  return Math.min(span.end, Math.max(span.start, Math.round(span.start + fraction * days - 0.5)));
}

/**
 * ISO date for a horizontal position in a calendar view, for a point added by clicking there.
 * A view without data is as wide as the narrowest tile. A view that is not a calendar period gives today.
 */
export function dateAtX(x: number, data: PeriodData | null, view: string, today: string): string {
  const period = periodFromKey(view);
  if (!period) return today;
  return fromDay(dayAtX(x, period, tileWidth(data ? flattenPeriod(data).points : [])));
}
