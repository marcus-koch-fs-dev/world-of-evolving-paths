import { toDay } from '../dates.js';
import { RING_GAP, shapeRadiusOf } from '../symbol.js';
import type { PlacedPoint, PlacedWorld, Position } from '../types.js';
import { pointAt } from './curves.js';
import { throughLines, todayOnThrough } from './through.js';
import type { Tracks } from './tracks.js';
import type { EdgeDraw, HereDraw, LeadDraw } from './types.js';
import { todayAxisX } from './viewEdges.js';

/** Groups items by a key in one pass, so a lookup per group does not search the whole list again. */
function groupBy<T>(items: T[], keyOf: (item: T) => string | undefined): Map<string, T[]> {
  return items.reduce((groups, item) => {
    const key = keyOf(item);
    if (key === undefined) return groups;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
    return groups;
  }, new Map<string, T[]>());
}

const HERE_RING_RADIUS = 11; // the ring of a marker in free space

/**
 * The ring of a marker: its own small one in free space. A marker inside the drawn circle of a point gets a ring
 * that starts just outside that circle, so the pulse is not hidden behind the symbol.
 */
export function ringAt(at: Position, points: readonly PlacedPoint[] = []): Pick<HereDraw, 'radius' | 'onPoint'> {
  const point = points.find(
    (candidate) => Math.hypot(candidate.x - at.x, candidate.y - at.y) < shapeRadiusOf(candidate),
  );
  if (!point) return { radius: HERE_RING_RADIUS, onPoint: false };
  return { radius: shapeRadiusOf(point) + RING_GAP, onPoint: true };
}

/**
 * How far along a line that leaves the view today is, from the point (0) to the end of the line (1), or null when
 * today does not lie on it. An incoming line runs from the date out there to the point, an outgoing one from the
 * point to the date out there.
 */
export function leadFraction(side: LeadDraw['side'], pointDay: number, leadDay: number, today: number): number | null {
  if (side === 'before') return leadDay <= today && today < pointDay ? (pointDay - today) / (pointDay - leadDay) : null;
  return pointDay <= today && today < leadDay ? (today - pointDay) / (leadDay - pointDay) : null;
}

/** The line of a lead, ordered so that it starts at its point. */
function fromPoint(lead: LeadDraw, point: PlacedPoint): Position[] {
  const start = lead.line[0];
  const end = lead.line[lead.line.length - 1];
  const startsAtPoint =
    Math.hypot(start.x - point.x, start.y - point.y) <= Math.hypot(end.x - point.x, end.y - point.y);
  return startsAtPoint ? lead.line : [...lead.line].reverse();
}

/**
 * How far along a line (from its point) the day of today lies on the time axis, 0 to 1. A line that runs to the
 * edge of the view is measured on the axis, not by the dates of its two points. Null without an axis or length.
 */
function alongAxis(line: Position[], point: PlacedPoint, axisX: number | null): number | null {
  const end = line[line.length - 1];
  if (axisX === null || end.x === point.x) return null;
  return Math.min(1, Math.max(0, (axisX - point.x) / (end.x - point.x)));
}

/**
 * Where "today" is on each path: on every line whose dates span today, also a line that leaves the view or comes
 * in from outside it. Where no line spans today the marker rests on a point (see `restingPoint`).
 * A view that does not cover today has no marker at all.
 */
export function buildHeres(
  world: PlacedWorld,
  edges: EdgeDraw[],
  leads: LeadDraw[] = [],
  tracks: Tracks = new Map(),
): HereDraw[] {
  const today = toDay(world.today);
  // A view of another time has no "today": a marker there would only sit on whatever point is nearest
  if (world.period && (today < world.period.start || today > world.period.end)) return [];
  const byId = new Map(world.points.map((point) => [point.id, point]));
  const dayOf = (id: string) => toDay((byId.get(id) as PlacedPoint).date);
  const edgesByPath = groupBy(edges, (edge) => byId.get(edge.to)?.pathId);
  const leadsByPath = groupBy(leads, (lead) => byId.get(lead.pointId)?.pathId);
  const pointsByPath = groupBy(world.points, (point) => point.pathId);

  const axisX = todayAxisX(world);
  const throughByPath = groupBy(throughLines(world, tracks), (line) => line.path.id);

  return world.paths.flatMap((path): HereDraw[] => {
    // The lines that span the whole view carry today on their own, next to what the points of the path do
    const onThrough = (throughByPath.get(path.id) ?? []).flatMap((line): HereDraw[] => {
      const at = todayOnThrough(world, line);
      return at ? [{ id: `${path.id}:through:${line.index}`, ...at, ...ringAt(at) }] : [];
    });
    if (!pointsByPath.has(path.id)) return onThrough;
    const connections = (edgesByPath.get(path.id) ?? [])
      .filter((edge) => dayOf(edge.from) <= today && today < dayOf(edge.to))
      .map((edge) => ({
        at: pointAt(edge.points, (today - dayOf(edge.from)) / (dayOf(edge.to) - dayOf(edge.from))),
        // The ends of the line decide, also when one of them belongs to another path
        near: [byId.get(edge.from), byId.get(edge.to)].filter((point) => point !== undefined),
      }));
    const outside = (leadsByPath.get(path.id) ?? []).flatMap((lead) => {
      const point = byId.get(lead.pointId) as PlacedPoint;
      const onLine = leadFraction(lead.side, dayOf(point.id), toDay(lead.lead.date), today);
      if (onLine === null) return [];
      const line = fromPoint(lead, point);
      return [{ at: pointAt(line, alongAxis(line, point, axisX) ?? onLine), near: [point] }];
    });
    // The id counts the markers of the path, not its lines, so one marker keeps its identity when it moves on
    // to the next line and glides there instead of being replaced
    const idOf = (index: number) => `${path.id}:${index}`;
    const spanning = [...connections, ...outside];
    if (spanning.length > 0) {
      const marks = spanning.map(({ at, near }, index) => ({ id: idOf(index), x: at.x, y: at.y, ...ringAt(at, near) }));
      return [...marks, ...onThrough];
    }
    const resting = restingPoint(pointsByPath.get(path.id) ?? [], today);
    const rest = resting ? [{ id: idOf(0), x: resting.x, y: resting.y, ...ringAt(resting, [resting]) }] : [];
    return [...rest, ...onThrough];
  });
}

/** The point a path rests on when no line spans today: the last one already reached, or else the first one ahead. */
export function restingPoint(points: readonly PlacedPoint[], today: number): PlacedPoint | undefined {
  const ordered = [...points].sort((a, b) => toDay(a.date) - toDay(b.date));
  return ordered.filter((point) => toDay(point.date) <= today).at(-1) ?? ordered[0];
}
