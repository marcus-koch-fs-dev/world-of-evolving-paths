import type { Position } from '../types.js';
import { LEVELS } from './levels.js';
import type { Level, LevelHeights, Store, StorePath } from './types.js';

/** One thing the user changed in the heights or the free places. `null` means it was forgotten. */
export type ChangedPart =
  | { kind: 'pointHeight'; level: Level; id: string; y: number | null }
  | { kind: 'arrowHeight'; level: Level; key: string; y: number | null }
  | { kind: 'freePlace'; id: string; position: Position | null };

/** The entries that differ between two records, by key. */
function differences<T>(before: Record<string, T>, after: Record<string, T>, same: (a: T, b: T) => boolean) {
  if (before === after) return [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].flatMap((key): [string, T | null][] => {
    const [was, now] = [before[key], after[key]];
    if (was !== undefined && now !== undefined && same(was, now)) return [];
    return was === undefined && now === undefined ? [] : [[key, now ?? null]];
  });
}

const samePlace = (a: Position, b: Position) => a.x === b.x && a.y === b.y;

const ofLevel = (level: Level, before: LevelHeights, after: LevelHeights): ChangedPart[] => [
  ...differences(before.points, after.points, Object.is).map(
    ([id, y]): ChangedPart => ({ kind: 'pointHeight', level, id, y }),
  ),
  ...differences(before.arrows, after.arrows, Object.is).map(
    ([key, y]): ChangedPart => ({ kind: 'arrowHeight', level, key, y }),
  ),
];

/**
 * What changed in the heights and free places between two stores, for saving only that. Records that are the same
 * object are skipped without a look, so a store that changed one height costs next to nothing. The paths are not
 * compared: the map never changes them, you change them yourself and know what it was.
 */
export function changedParts(before: Store, after: Store): ChangedPart[] {
  return [
    ...LEVELS.flatMap((level) => ofLevel(level, before.heights[level], after.heights[level])),
    ...differences(before.free, after.free, samePlace).map(
      ([id, position]): ChangedPart => ({ kind: 'freePlace', id, position }),
    ),
  ];
}

/** The store with a path put in the place of the path with the same id, or at the end when there is none. Other paths stay the same objects. */
export function replacePath(store: Store, path: StorePath): Store {
  const known = store.paths.some((candidate) => candidate.id === path.id);
  return {
    ...store,
    paths: known
      ? store.paths.map((candidate) => (candidate.id === path.id ? path : candidate))
      : [...store.paths, path],
  };
}
