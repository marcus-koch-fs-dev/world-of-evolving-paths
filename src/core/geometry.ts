import type { Bounds } from './camera';
import { toDay } from './dates';
import type { PlacedPoint, Position } from './types';

export type Edge = { id: string; from: PlacedPoint; to: PlacedPoint };

/** Between the two point ids in the id of a connection. Point ids may not contain it, so an edge id is unique. */
export const EDGE_SEPARATOR = '->';

/** All connections, taken from the `next` lists. */
export function getEdges(points: PlacedPoint[]): Edge[] {
  const byId = new Map(points.map((point) => [point.id, point]));
  return points.flatMap((from) =>
    from.next.flatMap((id) => {
      const to = byId.get(id);
      return to ? [{ id: `${from.id}${EDGE_SEPARATOR}${to.id}`, from, to }] : [];
    }),
  );
}

/** The four control points of the soft S-curve between two points. */
export function edgeCurve(from: Position, to: Position): [Position, Position, Position, Position] {
  const dx = to.x - from.x;
  return [from, { x: from.x + dx / 2, y: from.y }, { x: to.x - dx / 2, y: to.y }, to];
}

/**
 * How far along a connection today is (0 to 1).
 * With dates, time decides. The status only counts without dates, so "today" and the lit part agree.
 */
export function edgeProgress(from: PlacedPoint, to: PlacedPoint, today: string): number {
  if (to.status === 'abandoned') return 0;
  const start = toDay(from.date);
  const end = toDay(to.date);
  if (end <= start) return to.status === 'done' ? 1 : 0;
  return Math.min(1, Math.max(0, (toDay(today) - start) / (end - start)));
}

/** Distance from a point to a line segment. */
export function distanceToSegment(point: Position, a: Position, b: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

/** Smallest rectangle around all points, or null if there are none. */
export function contentBounds(points: Position[]): Bounds | null {
  if (points.length === 0) return null;
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}
