import type { Period } from './calendar';
import { periodFromKey } from './calendar';
import { type Layout, nearestFree } from './collision';
import { fromDay, toDay } from './dates';
import { flattenPeriod } from './flatten';
import { pick } from './random';
import type { FlatPoint, PathInfo, PeriodData, PlacedPoint, PlacedWorld, Position } from './types';

export type LayoutInput = {
  paths: PathInfo[];
  points: FlatPoint[];
  /** The calendar span the points are spread over. Without it the span of the points themselves is used. */
  period: Period | null;
  seed: number;
};

export type LayoutResult = { positions: Record<string, Position>; width: number };

const LANE_GAP = 200; // distance between two lanes
const SPACING = 140; // room per point along a path
const MIN_WIDTH = 1400; // no tile gets narrower than this
const EDGE_PADDING = 60;
const WOBBLE = 70; // how far a point may stray from the drift in y
const WIDEN = 240; // how far the branches of a fork go apart
const MAX_DRIFT = 0.35;
const DRIFT_DIVISOR = 600;
const START_SCATTER = 60;

/** Does a point extend its path or push it sideways? The one place for this rule. */
export function spreadOf(point: Pick<FlatPoint, 'kind' | 'next'>): 'extend' | 'widen' {
  return point.kind === 'crossroad' || point.next.length >= 2 ? 'widen' : 'extend';
}

function hasPin(point: FlatPoint): point is FlatPoint & Position {
  return point.x !== undefined && point.y !== undefined;
}

function compareByDate(a: FlatPoint, b: FlatPoint): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return a.id < b.id ? -1 : 1;
}

/** First and last day of what the points are spread over. */
function spanOf(input: LayoutInput): { start: number; end: number } {
  if (input.period) return input.period;
  const days = input.points.map((point) => toDay(point.date));
  if (days.length === 0) return { start: 0, end: 0 };
  return { start: Math.min(...days), end: Math.max(...days) };
}

/** Width of a tile: grows with the busiest path. */
export function tileWidth(points: FlatPoint[]): number {
  const perPath = new Map<string, number>();
  for (const point of points) perPath.set(point.pathId, (perPath.get(point.pathId) ?? 0) + 1);
  return Math.max(MIN_WIDTH, Math.max(0, ...perPath.values()) * SPACING);
}

/** Day at a horizontal position, the inverse of how the layout spreads dates. */
export function dayAtX(x: number, span: { start: number; end: number }, width: number): number {
  const fraction = (x - EDGE_PADDING) / (width - 2 * EDGE_PADDING);
  const days = span.end - span.start + 1;
  return Math.min(span.end, Math.max(span.start, Math.round(span.start + fraction * days - 0.5)));
}

/**
 * Lays the points of a view out. Pure and without real randomness:
 * the same input and seed always give the same layout.
 *
 * The date decides the rough x position inside the calendar span. Each path starts on its lane and drifts
 * with it: upper paths up, middle ones straight, lower ones down. A new point only extends its path.
 * Forks push their branches sideways. Then points repel each other in date order: placed ones stay, the new one yields.
 * Points with `x` and `y` are pinned and stay where they are.
 */
export function generateLayout(input: LayoutInput): LayoutResult {
  const { paths, points, seed } = input;
  const byId = new Map(points.map((point) => [point.id, point]));
  const span = spanOf(input);
  const width = tileWidth(points);

  // Only the order of the lanes counts, not the distance: empty lanes cost no room. The middle is y = 0.
  const lanes = [...paths].sort((a, b) => (a.lane ?? 0) - (b.lane ?? 0));
  const laneOf = new Map(lanes.map((path, i) => [path.id, (i - (lanes.length - 1) / 2) * LANE_GAP]));

  const xOf = (iso: string) => {
    const days = span.end - span.start + 1;
    const fraction = Math.min(1, Math.max(0, (toDay(iso) - span.start + 0.5) / days));
    return EDGE_PADDING + fraction * (width - 2 * EDGE_PADDING);
  };

  const ordered = [...points].sort(compareByDate);
  const parentOf = new Map<string, string>();
  for (const point of ordered) {
    for (const id of point.next) if (byId.has(id) && !parentOf.has(id)) parentOf.set(id, point.id);
  }

  const positions: Record<string, Position> = {};
  const layout: Layout = { bodies: [], links: [] };
  const place = (point: FlatPoint, at: Position) => {
    positions[point.id] = at;
    layout.bodies.push({ id: point.id, x: at.x, y: at.y, kind: point.kind, importance: point.importance });
  };

  // Pinned points first: they stay, the others make room
  for (const point of ordered) if (hasPin(point)) place(point, { x: point.x, y: point.y });
  for (const point of ordered) {
    const parentId = parentOf.get(point.id);
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parentId && parent && hasPin(point) && hasPin(parent)) layout.links.push({ from: parentId, to: point.id });
  }

  const range = { minX: 0, maxX: width };
  for (const point of ordered) {
    if (hasPin(point)) continue;
    const parentId = parentOf.get(point.id);
    const parent = parentId ? byId.get(parentId) : undefined;
    const x = xOf(point.date);
    const lane = laneOf.get(point.pathId) ?? 0;
    const drift = Math.max(-MAX_DRIFT, Math.min(MAX_DRIFT, lane / DRIFT_DIVISOR));
    const jitter = (pick(`${seed}|${point.id}|y`) - 0.5) * 2 * WOBBLE;
    let y: number;
    const parentAt = parent ? positions[parent.id] : undefined;
    if (parent && parentAt) {
      y = parentAt.y + drift * (x - parentAt.x) + jitter;
      if (spreadOf(parent) === 'widen') {
        const children = parent.next.filter((id) => byId.has(id));
        y += (children.indexOf(point.id) - (children.length - 1) / 2) * WIDEN;
      }
    } else {
      y = lane + (pick(`${seed}|${point.id}|s`) - 0.5) * START_SCATTER;
    }
    // The line to the parent counts during the search: it may not touch another point
    if (parentId && positions[parentId]) layout.links.push({ from: parentId, to: point.id });
    const free = nearestFree(layout, point, { x, y }, range);
    place(point, { x: Math.round(free.x), y: Math.round(free.y) });
    for (const id of point.next) {
      const child = byId.get(id);
      if (child && hasPin(child)) layout.links.push({ from: point.id, to: id });
    }
  }
  return { positions, width };
}

/**
 * The world to draw: every point with its position. Points that reference unknown points lose those links.
 * The view key decides the calendar span; a key that is not a period (a free view) uses the span of the points.
 */
export function placePeriod(data: PeriodData, view: string, today: string, seed: number): PlacedWorld {
  const period = periodFromKey(view);
  const flat = flattenPeriod(data);
  const { positions } = generateLayout({ paths: flat.paths, points: flat.points, period, seed });
  const points: PlacedPoint[] = flat.points.map((point) => {
    const { x: _x, y: _y, ...rest } = point;
    return { ...rest, ...positions[point.id], next: point.next.filter((id) => positions[id]) };
  });
  return { today, paths: flat.paths, points };
}

/** ISO date for a horizontal position in a view, for a point added by clicking there. */
export function dateAtX(x: number, data: PeriodData, view: string, today: string): string {
  const period = periodFromKey(view);
  if (!period) return today;
  return fromDay(dayAtX(x, period, tileWidth(flattenPeriod(data).points)));
}
