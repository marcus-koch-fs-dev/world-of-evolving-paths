import { distanceToSegment, getEdges } from './geometry';
import { symbolSize } from './symbol';
import type { PlacedPoint, PointKind, Position } from './types';

export type Body = { id: string; x: number; y: number; kind: PointKind; importance?: number };
export type Link = { from: string; to: string };
export type Layout = { bodies: Body[]; links: Link[] };
export type Mover = { id: string; kind: PointKind; importance?: number };
export type XRange = { minX: number; maxX: number };

const MARGIN = 12; // air around the symbol
const EPSILON = 0.001;
const RING_STEP = 4;
const RING_LIMIT = 6000;
const RING_ANGLES = 32;
const SETTLE_STEPS = 48;
const SETTLE_REFINEMENTS = 14;

const ringAngles = Array.from({ length: RING_ANGLES }, (_, k) => (k / RING_ANGLES) * Math.PI * 2);

/** Collision radius: half the symbol size plus some air, so bigger symbols keep more distance. */
export function collisionRadius(point: { kind: PointKind; importance?: number }): number {
  return symbolSize(point) / 2 + MARGIN;
}

/** Points and connections of a world as a collision layout. */
export function layoutOf(points: PlacedPoint[]): Layout {
  return {
    bodies: points.map((point) => ({
      id: point.id,
      x: point.x,
      y: point.y,
      kind: point.kind,
      importance: point.importance,
    })),
    links: getEdges(points).map((edge) => ({ from: edge.from.id, to: edge.to.id })),
  };
}

// Bodies by id. Kept per layout and rebuilt only when a body was added, so a search does not rebuild it for every spot.
const indexes = new WeakMap<Layout, { size: number; byId: Map<string, Body> }>();

function indexOf(layout: Layout): Map<string, Body> {
  const cached = indexes.get(layout);
  if (cached && cached.size === layout.bodies.length) return cached.byId;
  const byId = new Map(layout.bodies.map((body) => [body.id, body]));
  indexes.set(layout, { size: layout.bodies.length, byId });
  return byId;
}

/**
 * Is there room for `self` at `at`? Two points keep radius + radius apart.
 * A point may not sit on a foreign line, and its own lines may not touch another point. Lines may cross.
 */
export function isFreeAt(layout: Layout, self: Mover, at: Position): boolean {
  const radius = collisionRadius(self);
  const byId = indexOf(layout);
  const touchesPoint = layout.bodies.some(
    (other) =>
      other.id !== self.id && Math.hypot(at.x - other.x, at.y - other.y) < radius + collisionRadius(other) - EPSILON,
  );
  if (touchesPoint) return false;

  const isOwn = (link: Link) => link.from === self.id || link.to === self.id;
  const onForeignLine = layout.links.some((link) => {
    if (isOwn(link)) return false;
    const a = byId.get(link.from);
    const b = byId.get(link.to);
    return a !== undefined && b !== undefined && distanceToSegment(at, a, b) < radius - EPSILON;
  });
  if (onForeignLine) return false;

  // A point has only a few lines of its own, so checking them against the other points stays small
  return !layout.links.filter(isOwn).some((link) => {
    const neighbour = byId.get(link.from === self.id ? link.to : link.from);
    return (
      neighbour !== undefined &&
      layout.bodies.some(
        (body) =>
          body.id !== self.id &&
          body.id !== neighbour.id &&
          distanceToSegment(body, at, neighbour) < collisionRadius(body) - EPSILON,
      )
    );
  });
}

/** The spots on one ring around `at`, in a fixed angle order. */
function ringAround(at: Position, distance: number): Position[] {
  return ringAngles.map((angle) => ({ x: at.x + Math.cos(angle) * distance, y: at.y + Math.sin(angle) * distance }));
}

/**
 * Nearest free spot around `at`, searched in rings outwards in a fixed angle order, so it is always the same.
 * With `range` the spot stays inside the x limits (for example the calendar area of a view).
 */
export function nearestFree(layout: Layout, self: Mover, at: Position, range?: XRange): Position {
  const usable = (spot: Position) =>
    (!range || (spot.x >= range.minX && spot.x <= range.maxX)) && isFreeAt(layout, self, spot);
  if (usable(at)) return at;
  // Ring by ring outwards; a ring is only made once the rings before it had no free spot
  const search = (distance: number): Position =>
    ringAround(at, distance).find(usable) ?? (distance + RING_STEP <= RING_LIMIT ? search(distance + RING_STEP) : at);
  return search(RING_STEP);
}

/** Halves the gap between a free and a blocked position again and again, keeping the free side: the tightest free spot. */
function tightest(isFree: (t: number) => boolean, free: number, blocked: number): number {
  const [low] = Array.from({ length: SETTLE_REFINEMENTS }).reduce<[number, number]>(
    ([lo, hi]) => {
      const middle = (lo + hi) / 2;
      return isFree(middle) ? [middle, hi] : [lo, middle];
    },
    [free, blocked],
  );
  return low;
}

/**
 * Where a released point ends up: exactly at `target` if free, otherwise back along its way
 * to the first free spot. If even the start is blocked, the nearest free spot at the target.
 */
export function settle(layout: Layout, self: Mover, start: Position, target: Position): Position {
  if (isFreeAt(layout, self, target)) return target;
  const along = (t: number): Position => ({
    x: start.x + (target.x - start.x) * t,
    y: start.y + (target.y - start.y) * t,
  });
  const isFree = (t: number) => isFreeAt(layout, self, along(t));
  const steps = Array.from({ length: SETTLE_STEPS }, (_, i) => i / SETTLE_STEPS);
  const free = steps.findLast(isFree);
  if (free === undefined) return nearestFree(layout, self, target);
  return along(tightest(isFree, free, free + 1 / SETTLE_STEPS));
}
