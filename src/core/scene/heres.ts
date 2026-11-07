import { toDay } from '../dates.js';
import type { PlacedPoint, PlacedWorld } from '../types.js';
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
    // The id counts the markers of the path, not its lines, so one marker keeps its identity when it moves on
    // to the next line and glides there instead of being replaced
    const idOf = (index: number) => `${path.id}:${index}`;
    if (mine.length === 0) {
      const first = pointsByPath.get(path.id)?.[0];
      return first ? [{ id: idOf(0), x: first.x, y: first.y }] : [];
    }
    const spanning = mine.filter((edge) => dayOf(edge.from) <= today && today < dayOf(edge.to));
    if (spanning.length > 0) {
      return spanning.map((edge, index) => {
        const fraction = (today - dayOf(edge.from)) / (dayOf(edge.to) - dayOf(edge.from));
        const at = pointAt(edge.points, fraction);
        return { id: idOf(index), x: at.x, y: at.y };
      });
    }
    const earliest = mine.reduce((a, b) => (dayOf(b.from) < dayOf(a.from) ? b : a));
    const latest = mine.reduce((a, b) => (dayOf(b.to) > dayOf(a.to) ? b : a));
    const end = byId.get(today < dayOf(earliest.from) ? earliest.from : latest.to) as PlacedPoint;
    return [{ id: idOf(0), x: end.x, y: end.y }];
  });
}
