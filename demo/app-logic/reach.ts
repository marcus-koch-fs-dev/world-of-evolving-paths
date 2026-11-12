import { toDay } from 'world-of-evolving-paths';
import { boundaryKey } from './connection';

type NextOf = ReadonlyMap<string, readonly string[]>;

/** Does following the connections from `startId` lead to `targetId`? `nextOf` maps each id to the ids it links to. */
export function leadsTo(nextOf: NextOf, startId: string, targetId: string, seen = new Set<string>()): boolean {
  if (startId === targetId) return true;
  if (seen.has(startId)) return false;
  seen.add(startId);
  return (nextOf.get(startId) ?? []).some((id) => leadsTo(nextOf, id, targetId, seen));
}

/**
 * Which branch of a point a line belongs to: the position of the following point whose way leads on to the point at
 * the other end of the line. Two lines that leave one point (a fork) get different numbers, in every period that shows
 * them, also when points in between are hidden in one period and shown in the other.
 */
export function createBranchOf(points: readonly { id: string; next: readonly string[] }[]) {
  const nextOf: NextOf = new Map(points.map((point) => [point.id, point.next]));
  return (fromId: string, toId: string): number =>
    Math.max(
      0,
      (nextOf.get(fromId) ?? []).findIndex((following) => leadsTo(nextOf, following, toId)),
    );
}

/** The branch of a line, as `createBranchOf` gives it. */
export type BranchOf = ReturnType<typeof createBranchOf>;

type Chained = { id: string; date: string; next: readonly string[] };

/**
 * The key of the crossing of a border by a line from one point to another (see `boundaryKey`). A view may hide points,
 * so its line can run across several real connections. The key is made from the real connection that crosses the
 * border, the same one in the period before the border and in the period after it, whatever either of them hides.
 */
export function createBorderKeyOf(points: readonly Chained[]) {
  const byId = new Map(points.map((point) => [point.id, point]));
  const nextOf: NextOf = new Map(points.map((point) => [point.id, point.next]));
  const branchOf = createBranchOf(points);
  const crossing = (fromId: string, toId: string, lastDay: number, seen: ReadonlySet<string>) => {
    const from = byId.get(fromId);
    if (!from) return null;
    const found = from.next.flatMap((nextId, branch): { id: string; branch: number }[] => {
      const next = byId.get(nextId);
      if (!next || seen.has(nextId) || !leadsTo(nextOf, nextId, toId)) return [];
      if (toDay(from.date) <= lastDay && toDay(next.date) > lastDay) return [{ id: fromId, branch }];
      const deeper = crossing(nextId, toId, lastDay, new Set([...seen, nextId]));
      return deeper ? [deeper] : [];
    });
    return found[0] ?? null;
  };
  return (fromId: string, toId: string, lastDay: number): string => {
    const found = crossing(fromId, toId, lastDay, new Set([fromId]));
    return found ? boundaryKey(found.id, lastDay, found.branch) : boundaryKey(fromId, lastDay, branchOf(fromId, toId));
  };
}

/** The key of a border crossing, as `createBorderKeyOf` gives it. */
export type BorderKeyOf = ReturnType<typeof createBorderKeyOf>;
