import { toDay } from '../dates.js';
import { RING_GAP, shapeRadiusOf } from '../symbol.js';
import type { PlacedPoint, PlacedWorld, Position } from '../types.js';
import { pointAt } from './curves.js';
import type { EdgeDraw, HereDraw } from './types.js';

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
 * Where "today" is on each path: on every connection whose dates span today, otherwise at the nearest end.
 * A path without dated connections shows today at its first point.
 */
export function buildHeres(world: PlacedWorld, edges: EdgeDraw[]): HereDraw[] {
  const byId = new Map(world.points.map((point) => [point.id, point]));
  const today = toDay(world.today);
  const dayOf = (id: string) => toDay((byId.get(id) as PlacedPoint).date);
  const edgesByPath = groupBy(edges, (edge) => byId.get(edge.to)?.pathId);
  const pointsByPath = groupBy(world.points, (point) => point.pathId);

  return world.paths.flatMap((path): HereDraw[] => {
    const mine = edgesByPath.get(path.id) ?? [];
    const first = pointsByPath.get(path.id)?.[0];
    // The id counts the markers of the path, not its lines, so one marker keeps its identity when it moves on
    // to the next line and glides there instead of being replaced
    const idOf = (index: number) => `${path.id}:${index}`;
    if (mine.length === 0) {
      return first ? [{ id: idOf(0), x: first.x, y: first.y, ...ringAt(first, [first]) }] : [];
    }
    const spanning = mine.filter((edge) => dayOf(edge.from) <= today && today < dayOf(edge.to));
    if (spanning.length > 0) {
      return spanning.map((edge, index) => {
        const fraction = (today - dayOf(edge.from)) / (dayOf(edge.to) - dayOf(edge.from));
        const at = pointAt(edge.points, fraction);
        // The ends of the line decide, also when one of them belongs to another path
        const ends = [byId.get(edge.from), byId.get(edge.to)].filter((point) => point !== undefined);
        return { id: idOf(index), x: at.x, y: at.y, ...ringAt(at, ends) };
      });
    }
    const earliest = mine.reduce((a, b) => (dayOf(b.from) < dayOf(a.from) ? b : a));
    const latest = mine.reduce((a, b) => (dayOf(b.to) > dayOf(a.to) ? b : a));
    const end = byId.get(today < dayOf(earliest.from) ? earliest.from : latest.to) as PlacedPoint;
    return [{ id: idOf(0), x: end.x, y: end.y, ...ringAt(end, [end]) }];
  });
}
