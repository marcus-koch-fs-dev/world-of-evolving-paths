import { toDay } from '../dates.js';
import { type Chain, chainsOfPath, type Lookup, type PathChains } from './chains.js';
import { indexPoints, type PointInfo } from './order.js';
import type { Level, StorePath } from './types.js';

/** The first and last day of the points of a path, or null for a path without points. */
export type PathSpan = { first: number; last: number } | null;

/** The first and the last day of the points of a path. */
export function pathSpan(path: StorePath): PathSpan {
  const days = path.branches.flatMap((branch) => branch.points.map((point) => toDay(point.date)));
  if (days.length === 0) return null;
  return {
    first: days.reduce((lowest, day) => Math.min(lowest, day)),
    last: days.reduce((highest, day) => Math.max(highest, day)),
  };
}

/** What the cache gives while one store is built. */
export type CacheView = {
  lookup: Lookup;
  /** The lines of a path on a level. Unchanged paths give the answer of the last time. */
  chainsOf(path: StorePath, level: Level): Chain[];
  /** The first and the last day of a path. */
  spanOf(path: StorePath): PathSpan;
};

export type StoreCache = { view(paths: readonly StorePath[]): CacheView };

/**
 * Remembers what was worked out for a path, so a path that has not changed is not worked out again. A path counts as
 * unchanged when it is the same object as before: change a path by putting a new object in its place and leave the
 * others as they are. The lines of a fork also depend on the paths its branches leave from; when one of them changed,
 * the fork is worked out again. The memory lives in the cache and ends with it.
 */
export function createStoreCache(): StoreCache {
  const infos = new WeakMap<StorePath, Map<string, PointInfo>>();
  const chains = new WeakMap<StorePath, Map<Level, PathChains>>();
  const spans = new WeakMap<StorePath, PathSpan>();

  const infosOf = (path: StorePath): Map<string, PointInfo> => {
    const known = infos.get(path);
    if (known) return known;
    const made = indexPoints([path]);
    infos.set(path, made);
    return made;
  };

  return {
    view(paths) {
      const current = new Set(paths);
      const lookup: Lookup = {
        point(id) {
          const path = paths.find((candidate) => infosOf(candidate).has(id));
          const info = path && infosOf(path).get(id);
          return path && info ? { info, path } : undefined;
        },
        branch(id) {
          const path = paths.find((candidate) => candidate.branches.some((branch) => branch.id === id));
          const branch = path?.branches.find((candidate) => candidate.id === id);
          return path && branch ? { path, branch } : undefined;
        },
      };
      return {
        lookup,
        chainsOf(path, level) {
          const byLevel = chains.get(path) ?? new Map<Level, PathChains>();
          chains.set(path, byLevel);
          const known = byLevel.get(level);
          if (known?.depends.every((other) => current.has(other))) return known.chains;
          const made = chainsOfPath(path, level, lookup);
          byLevel.set(level, made);
          return made.chains;
        },
        spanOf(path) {
          if (spans.has(path)) return spans.get(path) ?? null;
          const made = pathSpan(path);
          spans.set(path, made);
          return made;
        },
      };
    },
  };
}
