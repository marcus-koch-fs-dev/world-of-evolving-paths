import type { Period } from './calendar.js';
import { periodFromKey } from './calendar.js';
import { type Layout, nearestFree } from './collision.js';
import { fromDay, toDay } from './dates.js';
import { flattenPeriod } from './flatten.js';
import { pick } from './random.js';
import type { FlatPoint, PathInfo, PeriodData, PlacedPoint, PlacedWorld, Position } from './types.js';

export type LayoutInput = {
  paths: PathInfo[];
  points: FlatPoint[];
  /** The calendar span the points are spread over. Without it the span of the points themselves is used. */
  period: Period | null;
  seed: number;
};

export type LayoutResult = { positions: Record<string, Position>; width: number };

const LANE_GAP = 200; // distance between two lanes
const SPACING = 200; // room per point along a path
const MIN_WIDTH = 2200; // no tile gets narrower than this
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
  const perPath = points.reduce(
    (counts, point) => counts.set(point.pathId, (counts.get(point.pathId) ?? 0) + 1),
    new Map<string, number>(),
  );
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
  ordered
    .flatMap((point) => point.next.filter((id) => byId.has(id)).map((id): [string, string] => [id, point.id]))
    .forEach(([id, parent]) => {
      if (!parentOf.has(id)) parentOf.set(id, parent);
    });

  // No prototype, so a point id such as "constructor" or "__proto__" is just a key
  const positions: Record<string, Position> = Object.create(null);
  const layout: Layout = { bodies: [], links: [] };
  const place = (point: FlatPoint, at: Position) => {
    positions[point.id] = at;
    layout.bodies.push({ id: point.id, x: at.x, y: at.y, kind: point.kind, importance: point.importance });
  };

  // Pinned points first: they stay, the others make room
  const pinned = ordered.filter(hasPin);
  pinned.forEach((point) => {
    place(point, { x: point.x, y: point.y });
  });
  pinned.forEach((point) => {
    const parentId = parentOf.get(point.id);
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parentId && parent && hasPin(parent)) layout.links.push({ from: parentId, to: point.id });
  });

  const range = { minX: 0, maxX: width };
  ordered
    .filter((point) => !hasPin(point))
    .forEach((point) => {
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
      point.next
        .filter((id) => {
          const child = byId.get(id);
          return child !== undefined && hasPin(child);
        })
        .forEach((id) => {
          layout.links.push({ from: point.id, to: id });
        });
    });
  return { positions, width };
}

/** The paths and points of a view together with where each point is. It does not depend on today. */
export type PeriodLayout = { paths: PathInfo[]; points: FlatPoint[]; positions: Record<string, Position> };

/**
 * Lays out the points of a view. The view key decides the calendar span;
 * a key that is not a period (a free view) uses the span of the points.
 */
export function layoutPeriod(data: PeriodData, view: string, seed: number): PeriodLayout {
  const flat = flattenPeriod(data);
  const { positions } = generateLayout({ paths: flat.paths, points: flat.points, period: periodFromKey(view), seed });
  return { ...flat, positions };
}

/**
 * The world to draw: every point with its position. Points that reference unknown points lose those links.
 * Changing `today` only needs this step again, not a new layout.
 */
export function placeWorld(layout: PeriodLayout, today: string): PlacedWorld {
  const { positions } = layout;
  const points: PlacedPoint[] = layout.points.map((point) => {
    const { x: _x, y: _y, ...rest } = point;
    return { ...rest, ...positions[point.id], next: point.next.filter((id) => positions[id]) };
  });
  return { today, paths: layout.paths, points };
}

/**
 * Everything the layout depends on, as text: the paths and lanes, and for each point its id, date, kind, links,
 * importance and pin. Two data objects with the same signature get the same layout, whatever else differs
 * (titles, statuses, strengths).
 */
export function layoutSignature(data: PeriodData): string {
  return JSON.stringify(
    data.paths.map((path) => [
      path.id,
      path.lane ?? null,
      path.points.map((point) => [
        point.id,
        point.date,
        point.kind,
        point.next,
        point.importance ?? null,
        point.x ?? null,
        point.y ?? null,
      ]),
    ]),
  );
}

/** The layout of earlier data for new data with the same signature: new details on the points, same positions. */
export function reuseLayout(data: PeriodData, previous: PeriodLayout): PeriodLayout {
  return { ...flattenPeriod(data), positions: previous.positions };
}

/** Lays a view out and places it in one go. */
export function placePeriod(data: PeriodData, view: string, today: string, seed: number): PlacedWorld {
  return placeWorld(layoutPeriod(data, view, seed), today);
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
