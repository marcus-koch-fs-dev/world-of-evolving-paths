import { distanceToSegment, getEdges } from './geometry';
import type { PlacedPoint, PointKind, Position } from './types';

export type Body = { id: string; x: number; y: number; kind: PointKind; importance?: number };
export type Link = { from: string; to: string };
export type Layout = { bodies: Body[]; links: Link[] };
export type Mover = { id: string; kind: PointKind; importance?: number };
export type XRange = { minX: number; maxX: number };

const GOAL_SIZE = 72;
const POINT_SIZE = 56;
const MARGIN = 12; // air around the symbol
const PER_IMPORTANCE = 6; // each importance step keeps a little more distance
const EPSILON = 0.001;
const RING_STEP = 4;
const RING_LIMIT = 6000;
const RING_ANGLES = 32;
const SETTLE_STEPS = 48;
const SETTLE_REFINEMENTS = 14;

/** Collision radius: half the symbol size (goal 72, otherwise 56) plus air plus importance. */
export function collisionRadius(point: { kind: PointKind; importance?: number }): number {
  const size = point.kind === 'goal' ? GOAL_SIZE : POINT_SIZE;
  return size / 2 + MARGIN + ((point.importance ?? 1) - 1) * PER_IMPORTANCE;
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

/**
 * Is there room for `self` at `at`? Two points keep radius + radius apart.
 * A point may not sit on a foreign line, and its own lines may not touch another point. Lines may cross.
 */
export function isFreeAt(layout: Layout, self: Mover, at: Position): boolean {
  const radius = collisionRadius(self);
  const byId = new Map(layout.bodies.map((body) => [body.id, body]));
  for (const other of layout.bodies) {
    if (other.id === self.id) continue;
    if (Math.hypot(at.x - other.x, at.y - other.y) < radius + collisionRadius(other) - EPSILON) return false;
  }
  for (const link of layout.links) {
    const own = link.from === self.id || link.to === self.id;
    if (!own) {
      const a = byId.get(link.from);
      const b = byId.get(link.to);
      if (a && b && distanceToSegment(at, a, b) < radius - EPSILON) return false;
      continue;
    }
    const neighbour = byId.get(link.from === self.id ? link.to : link.from);
    if (!neighbour) continue;
    for (const body of layout.bodies) {
      if (body.id === self.id || body.id === neighbour.id) continue;
      if (distanceToSegment(body, at, neighbour) < collisionRadius(body) - EPSILON) return false;
    }
  }
  return true;
}

/**
 * Nearest free spot around `at`, searched in rings outwards in a fixed angle order, so it is always the same.
 * With `range` the spot stays inside the x limits (for example the calendar area of a view).
 */
export function nearestFree(layout: Layout, self: Mover, at: Position, range?: XRange): Position {
  const inRange = (spot: Position) => !range || (spot.x >= range.minX && spot.x <= range.maxX);
  if (inRange(at) && isFreeAt(layout, self, at)) return at;
  for (let distance = RING_STEP; distance <= RING_LIMIT; distance += RING_STEP) {
    for (let k = 0; k < RING_ANGLES; k++) {
      const angle = (k / RING_ANGLES) * Math.PI * 2;
      const spot = { x: at.x + Math.cos(angle) * distance, y: at.y + Math.sin(angle) * distance };
      if (inRange(spot) && isFreeAt(layout, self, spot)) return spot;
    }
  }
  return at;
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
  for (let i = SETTLE_STEPS - 1; i >= 0; i--) {
    const free = i / SETTLE_STEPS;
    if (!isFreeAt(layout, self, along(free))) continue;
    // Between a free step and the blocked next one, find the tightest free spot
    let low = free;
    let high = (i + 1) / SETTLE_STEPS;
    for (let n = 0; n < SETTLE_REFINEMENTS; n++) {
      const middle = (low + high) / 2;
      if (isFreeAt(layout, self, along(middle))) low = middle;
      else high = middle;
    }
    return along(low);
  }
  return nearestFree(layout, self, target);
}
