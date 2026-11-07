import { toDay } from '../dates';
import type { PlacedPoint, PlacedWorld } from '../types';
import { pointAt } from './curves';
import type { EdgeDraw, HereDraw } from './types';

/**
 * Where "today" is on each path: on every connection whose dates span today, otherwise at the nearest end.
 * A path without dated connections shows today at its first point.
 */
export function buildHeres(world: PlacedWorld, edges: EdgeDraw[]): HereDraw[] {
  const byId = new Map(world.points.map((point) => [point.id, point]));
  const today = toDay(world.today);
  const dayOf = (id: string) => toDay((byId.get(id) as PlacedPoint).date);
  const heres: HereDraw[] = [];

  for (const path of world.paths) {
    const mine = edges.filter((edge) => byId.get(edge.to)?.pathId === path.id);
    if (mine.length === 0) {
      const first = world.points.find((point) => point.pathId === path.id);
      if (first) heres.push({ id: path.id, x: first.x, y: first.y });
      continue;
    }
    const spanning = mine.filter((edge) => dayOf(edge.from) <= today && today < dayOf(edge.to));
    for (const edge of spanning) {
      const fraction = (today - dayOf(edge.from)) / (dayOf(edge.to) - dayOf(edge.from));
      const at = pointAt(edge.points, fraction);
      heres.push({ id: `${path.id}:${edge.id}`, x: at.x, y: at.y });
    }
    if (spanning.length > 0) continue;
    const earliest = mine.reduce((a, b) => (dayOf(b.from) < dayOf(a.from) ? b : a));
    const latest = mine.reduce((a, b) => (dayOf(b.to) > dayOf(a.to) ? b : a));
    const end = byId.get(today < dayOf(earliest.from) ? earliest.from : latest.to) as PlacedPoint;
    heres.push({ id: path.id, x: end.x, y: end.y });
  }
  return heres;
}
