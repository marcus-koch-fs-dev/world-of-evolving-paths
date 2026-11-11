import { type Lead, type Period, toDay } from 'world-of-evolving-paths';
import type { DemoPoint } from './types';

export type Through = { from: Lead; to: Lead };

const toLead = (point: DemoPoint): Lead => ({ title: point.title, date: point.date, id: point.id });

/**
 * The connections that span a whole period without a point of the view in it: from a point before the period to a
 * point after it, passing only points the view hides. A fork gives one for each branch. They are grouped by path,
 * the earliest end first. There are none in a free view.
 */
export function throughConnections(
  all: readonly DemoPoint[],
  period: Period | null,
  isShown: (point: DemoPoint) => boolean,
): Map<string, Through[]> {
  if (!period) return new Map();
  const byId = new Map(all.map((point) => [point.id, point]));
  // The first points the view shows that a point leads to, passing the ones it hides
  const reached = (id: string, seen: Set<string>): DemoPoint[] =>
    (byId.get(id)?.next ?? []).flatMap((nextId) => {
      const next = byId.get(nextId);
      if (!next || seen.has(nextId)) return [];
      seen.add(nextId);
      return isShown(next) ? [next] : reached(nextId, seen);
    });
  const found = all
    .filter((point) => isShown(point) && toDay(point.date) < period.start)
    .flatMap((from) =>
      reached(from.id, new Set([from.id]))
        .filter((to) => toDay(to.date) > period.end)
        .map((to): [string, Through] => [from.pathId, { from: toLead(from), to: toLead(to) }]),
    );
  return found.reduce((groups, [pathId, through]) => {
    const list = groups.get(pathId) ?? [];
    return groups.set(
      pathId,
      [...list, through].sort((a, b) => a.to.date.localeCompare(b.to.date)),
    );
  }, new Map<string, Through[]>());
}
