import { fromDay } from '../dates.js';
import type { CacheView } from './cache.js';
import { type Chain, chainsOfPath, createLookup } from './chains.js';
import { createLevelReader, type LevelReader } from './reader.js';
import type { Level, Store, StorePath, StorePoint } from './types.js';

/** A point of the branch, the point it forks off from (`anchor`), or the last point of a branch that has none on this level (`end`). */
export type ItemElement<Role extends 'point' | 'anchor' | 'end' = 'point' | 'anchor' | 'end'> = {
  type: Role;
  point: StorePoint;
  y: number;
};

export type ArrowElement = {
  type: 'arrow';
  key: string;
  date: string;
  side: 'before' | 'after';
  y: number;
  /** The point the line comes from (before the border) and the one it goes to (after it). */
  from: StorePoint;
  to: StorePoint;
};

/**
 * What a branch line runs through inside a period, in time order. A line is drawn from one element to the next.
 * `arrow` is where the line crosses the border of the period (`before`: the start, `after`: the end): it has a date
 * and a height, and the period next to it has the very same arrow.
 */
export type LevelElement = ItemElement<'point'> | ItemElement<'anchor'> | ItemElement<'end'> | ArrowElement;

export type LevelBranch = { id: string; splitsAt?: string; elements: LevelElement[] };

export type LevelPath = Omit<StorePath, 'branches'> & { branches: LevelBranch[] };

type Span = { start: number; end: number };

function elementsOf(chain: Chain, span: Span, reader: LevelReader): LevelElement[] {
  const inside = chain.items
    .filter((item) => item.day >= span.start && item.day <= span.end)
    .map((item): LevelElement => ({ type: item.role, point: item.point, y: reader.pointY(item.point.id) }));
  const arrow = (borderDay: number, side: 'before' | 'after'): LevelElement[] => {
    const reading = reader.arrowAt(chain, borderDay);
    return reading
      ? [
          {
            type: 'arrow',
            key: reading.key,
            date: fromDay(borderDay),
            side,
            y: reading.y,
            from: reading.from,
            to: reading.to,
          },
        ]
      : [];
  };
  return [...arrow(span.start, 'before'), ...inside, ...arrow(span.end + 1, 'after')];
}

export type LevelOptions = {
  /** Remembers what was worked out for unchanged paths (see `createStoreCache`). */
  view?: CacheView;
  /** Build only these paths. The rest of the store is still used to find where forks leave from. */
  pathIds?: readonly string[];
};

/**
 * The paths of one period of a level. A branch shows the points that are important enough for the level, and an arrow
 * at each border of the period that its line crosses. The same function builds every level.
 */
export function buildLevel(store: Store, level: Level, period: Span, options: LevelOptions = {}): LevelPath[] {
  const { view, pathIds } = options;
  const lookup = view?.lookup ?? createLookup(store.paths);
  const reader = createLevelReader(store, level, lookup);
  const wanted = pathIds && new Set(pathIds);
  return store.paths
    .filter((path) => !wanted || wanted.has(path.id))
    .flatMap((path): LevelPath[] => {
      const chains = new Map(
        (view ? view.chainsOf(path, level) : chainsOfPath(path, level, lookup).chains).map((chain) => [
          chain.branchId,
          chain,
        ]),
      );
      const branches = path.branches.flatMap((branch): LevelBranch[] => {
        const chain = chains.get(branch.id);
        const elements = chain ? elementsOf(chain, period, reader) : [];
        return elements.length === 0 ? [] : [{ id: branch.id, splitsAt: branch.splitsAt, elements }];
      });
      return branches.length === 0 ? [] : [{ ...path, branches }];
    });
}
