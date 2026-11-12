import { toDay } from '../dates.js';
import { MIN_PRIO } from './levels.js';
import { compareByDate, indexBranches, indexPoints, type PointInfo, sortedPoints } from './order.js';
import type { Branch, Level, StorePath, StorePoint } from './types.js';

/**
 * One thing a branch line runs through on a level: a point of the branch, the point it forks off from (`anchor`), or,
 * for a branch without a point on this level, the last point of the branch (`end`).
 */
export type ChainItem = {
  point: StorePoint;
  role: 'point' | 'anchor' | 'end';
  /** The day number of the date of the point, worked out once. */
  day: number;
};

/** The line of one branch on one level, from its anchor to its end, in time order. */
export type Chain = { pathId: string; branchId: string; items: ChainItem[] };

/** A point with the path it lives in. */
export type Located = { info: PointInfo; path: StorePath };

/** Finds points and branches anywhere in the store. A fork looks for the point it leaves from. */
export type Lookup = {
  point(id: string): Located | undefined;
  branch(id: string): { path: StorePath; branch: Branch } | undefined;
};

/** A lookup that builds its index at once. For one-off work; the cache has a cheaper one. */
export function createLookup(paths: readonly StorePath[]): Lookup {
  const points = new Map(
    paths.flatMap((path) => [...indexPoints([path])].map(([id, info]): [string, Located] => [id, { info, path }])),
  );
  const branches = indexBranches(paths);
  return { point: (id) => points.get(id), branch: (id) => branches.get(id) };
}

/** The line of every branch of one path on a level, and the other paths its forks leave from. */
export type PathChains = { chains: Chain[]; depends: readonly StorePath[] };

/**
 * Where a branch starts on a level: its split point, or when that one is hidden the last point of the branch it forks
 * from before it. When that branch has none either, the search goes on to the branch before.
 */
function createAnchorFinder(lookup: Lookup, level: Level) {
  const shown = (point: StorePoint) => point.prio >= MIN_PRIO[level];
  const anchorOf = (branch: Branch, seen: ReadonlySet<string>): StorePoint | null => {
    const split = branch.splitsAt === undefined ? undefined : lookup.point(branch.splitsAt);
    if (!split || seen.has(branch.id)) return null;
    if (shown(split.info.point)) return split.info.point;
    const parent = lookup.branch(split.info.branchId)?.branch;
    if (!parent) return null;
    const before = sortedPoints(parent.points)
      .filter((point) => shown(point) && compareByDate(point, split.info.point) < 0)
      .at(-1);
    return before ?? anchorOf(parent, new Set([...seen, branch.id]));
  };
  return (branch: Branch) => anchorOf(branch, new Set());
}

/** The line of every branch of one path on a level. A branch without any point has no line. */
export function chainsOfPath(path: StorePath, level: Level, lookup: Lookup): PathChains {
  const touched = new Set<StorePath>();
  const watching: Lookup = {
    point(id) {
      const found = lookup.point(id);
      if (found) touched.add(found.path);
      return found;
    },
    branch(id) {
      const found = lookup.branch(id);
      if (found) touched.add(found.path);
      return found;
    },
  };
  const anchorOf = createAnchorFinder(watching, level);
  const chains = path.branches.flatMap((branch): Chain[] => {
    const ordered = sortedPoints(branch.points);
    const own = ordered.filter((point) => point.prio >= MIN_PRIO[level]);
    const last = ordered.at(-1);
    const body: ChainItem[] =
      own.length > 0
        ? own.map((point) => ({ point, role: 'point', day: toDay(point.date) }))
        : last
          ? [{ point: last, role: 'end', day: toDay(last.date) }]
          : [];
    const anchor = anchorOf(branch);
    return body.length === 0
      ? []
      : [
          {
            pathId: path.id,
            branchId: branch.id,
            items: [...(anchor ? [{ point: anchor, role: 'anchor' as const, day: toDay(anchor.date) }] : []), ...body],
          },
        ];
  });
  return { chains, depends: [...touched].filter((other) => other !== path) };
}

/** The line of every branch on a level. */
export function levelChains(paths: readonly StorePath[], level: Level): Chain[] {
  const lookup = createLookup(paths);
  return paths.flatMap((path) => chainsOfPath(path, level, lookup).chains);
}
