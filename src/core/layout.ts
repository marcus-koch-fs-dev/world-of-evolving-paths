import type { Period } from './calendar.js';
import { periodFromKey } from './calendar.js';
import { type Layout, nearestFree } from './collision.js';
import { toDay } from './dates.js';
import { flattenPeriod } from './flatten.js';
import { pick } from './random.js';
import { type Span, tileWidth, xOfDate } from './timeAxis.js';
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
function spanOf(input: LayoutInput): Span {
  if (input.period) return input.period;
  const days = input.points.map((point) => toDay(point.date));
  if (days.length === 0) return { start: 0, end: 0 };
  return { start: Math.min(...days), end: Math.max(...days) };
}

/** The first point (in date order) that links to each point. */
export function parentsOf(ordered: FlatPoint[], byId: ReadonlyMap<string, FlatPoint>): Map<string, string> {
  return ordered
    .flatMap((point) => point.next.filter((id) => byId.has(id)).map((id): [string, string] => [id, point.id]))
    .reduce(
      (parents, [id, parent]) => (parents.has(id) ? parents : parents.set(id, parent)),
      new Map<string, string>(),
    );
}

/** The y position of every path's lane. Only the order counts, not the distance: empty lanes cost no room. */
export function laneOffsets(paths: PathInfo[]): Map<string, number> {
  const lanes = [...paths].sort((a, b) => (a.lane ?? 0) - (b.lane ?? 0));
  return new Map(lanes.map((path, i) => [path.id, (i - (lanes.length - 1) / 2) * LANE_GAP]));
}

type TargetInput = {
  point: FlatPoint;
  x: number;
  lane: number;
  seed: number;
  parent?: FlatPoint;
  /** Where the parent was placed. */
  parentAt?: Position;
  byId: ReadonlyMap<string, FlatPoint>;
};

/**
 * Where a point wants to be in y before the collision search. A start sits on its lane. A follower drifts with its
 * lane away from the parent, and a fork pushes its branches apart.
 */
export function targetY({ point, x, lane, seed, parent, parentAt, byId }: TargetInput): number {
  if (!parent || !parentAt) return lane + (pick(`${seed}|${point.id}|s`) - 0.5) * START_SCATTER;
  const drift = Math.max(-MAX_DRIFT, Math.min(MAX_DRIFT, lane / DRIFT_DIVISOR));
  const jitter = (pick(`${seed}|${point.id}|y`) - 0.5) * 2 * WOBBLE;
  const y = parentAt.y + drift * (x - parentAt.x) + jitter;
  if (spreadOf(parent) !== 'widen') return y;
  const children = parent.next.filter((id) => byId.has(id));
  return y + (children.indexOf(point.id) - (children.length - 1) / 2) * WIDEN;
}

/** The positions found so far, and the same points as bodies and links for the collision search. */
function createPlacements() {
  const positions: Record<string, Position> = Object.create(null); // no prototype: an id such as "__proto__" is a key
  const layout: Layout = { bodies: [], links: [] };
  return {
    positions,
    layout,
    place(point: FlatPoint, at: Position) {
      positions[point.id] = at;
      layout.bodies.push({ id: point.id, x: at.x, y: at.y, kind: point.kind, importance: point.importance });
    },
    link(from: string, to: string) {
      layout.links.push({ from, to });
    },
  };
}

type Placements = ReturnType<typeof createPlacements>;

/** Pinned points go first, they stay where they are and the others make room. */
function placePinned(
  ordered: FlatPoint[],
  parentOf: ReadonlyMap<string, string>,
  byId: ReadonlyMap<string, FlatPoint>,
  placements: Placements,
): void {
  const pinned = ordered.filter(hasPin);
  pinned.forEach((point) => {
    placements.place(point, { x: point.x, y: point.y });
  });
  pinned.forEach((point) => {
    const parentId = parentOf.get(point.id);
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parentId && parent && hasPin(parent)) placements.link(parentId, point.id);
  });
}

/**
 * Lays the points of a view out. Pure and without real randomness:
 * the same input and seed always give the same layout.
 *
 * The date decides the rough x position inside the calendar span. Each path starts on its lane and drifts
 * with it: upper paths up, middle ones straight, lower ones down. A new point only extends its path.
 * Forks push their branches sideways. Then points repel each other in date order: placed ones stay, the new one yields.
 * Points with `x` and `y` are pinned and stay where they are; with only `y` they keep their height.
 */
export function generateLayout(input: LayoutInput): LayoutResult {
  const { paths, seed } = input;
  const span = spanOf(input);
  const width = tileWidth(input.points);
  // A point with only a height is pinned there and sits on its date along the time axis
  const points = input.points.map((point) =>
    point.y !== undefined && point.x === undefined ? { ...point, x: xOfDate(point.date, span, width) } : point,
  );
  const byId = new Map(points.map((point) => [point.id, point]));
  const laneOf = laneOffsets(paths);
  const ordered = [...points].sort(compareByDate);
  const parentOf = parentsOf(ordered, byId);
  const placements = createPlacements();
  const range = { minX: 0, maxX: width };

  placePinned(ordered, parentOf, byId, placements);
  ordered
    .filter((point) => !hasPin(point))
    .forEach((point) => {
      const parentId = parentOf.get(point.id);
      const parent = parentId ? byId.get(parentId) : undefined;
      const parentAt = parent ? placements.positions[parent.id] : undefined;
      const x = xOfDate(point.date, span, width);
      const y = targetY({ point, x, lane: laneOf.get(point.pathId) ?? 0, seed, parent, parentAt, byId });
      // The line to the parent counts during the search: it may not touch another point
      if (parentId && parentAt) placements.link(parentId, point.id);
      const free = nearestFree(placements.layout, point, { x, y }, range);
      placements.place(point, { x: Math.round(free.x), y: Math.round(free.y) });
      point.next
        .filter((id) => {
          const child = byId.get(id);
          return child !== undefined && hasPin(child);
        })
        .forEach((id) => {
          placements.link(point.id, id);
        });
    });
  return { positions: placements.positions, width };
}

/** The paths and points of a view together with where each point is. It does not depend on today. */
export type PeriodLayout = {
  paths: PathInfo[];
  points: FlatPoint[];
  positions: Record<string, Position>;
  /** The days the view covers. Null for a free view. */
  period?: Span | null;
};

/**
 * Lays out the points of a view. The view key decides the calendar span;
 * a key that is not a period (a free view) uses the span of the points.
 */
export function layoutPeriod(data: PeriodData, view: string, seed: number): PeriodLayout {
  const flat = flattenPeriod(data);
  const period = periodFromKey(view);
  const { positions } = generateLayout({ paths: flat.paths, points: flat.points, period, seed });
  return { ...flat, positions, period: period && { start: period.start, end: period.end } };
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
  return { today, period: layout.period ?? null, paths: layout.paths, points };
}

/** Lays a view out and places it in one go. */
export function placePeriod(data: PeriodData, view: string, today: string, seed: number): PlacedWorld {
  return placeWorld(layoutPeriod(data, view, seed), today);
}
