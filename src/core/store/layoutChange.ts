import { indexPoints } from './order.js';
import type { Level, LevelHeights, PathLayout, Store } from './types.js';

const NO_LAYOUT: PathLayout = {};

/** What to do with the layout of one path. Returning the layout it got means nothing changed. */
export type LayoutChange = (layout: PathLayout) => PathLayout;

/** The store with the layouts of some paths changed. Paths that stay the same, or whose layout does, stay the same objects. */
export function changeLayouts(store: Store, changes: ReadonlyMap<string, LayoutChange>): Store {
  if (changes.size === 0) return store;
  return {
    ...store,
    paths: store.paths.map((path) => {
      const change = changes.get(path.id);
      if (!change) return path;
      const before = path.layout ?? NO_LAYOUT;
      const after = change(before);
      return after === before ? path : { ...path, layout: after };
    }),
  };
}

/** The entries of a record, grouped by the path that owns their key. Keys without an owner are dropped. */
export function groupedByOwner<T>(
  record: Readonly<Record<string, T>>,
  ownerOf: (key: string) => string | undefined,
): Map<string, [string, T][]> {
  return Object.entries(record).reduce((groups, entry) => {
    const owner = ownerOf(entry[0]);
    if (owner === undefined) return groups;
    const group = groups.get(owner) ?? [];
    group.push(entry);
    return groups.set(owner, group);
  }, new Map<string, [string, T][]>());
}

/** For every point id the id of its path. */
export function pointOwners(store: Store): (id: string) => string | undefined {
  const infos = indexPoints(store.paths);
  return (id) => infos.get(id)?.pathId;
}

/** The record without some keys. The same object when none of them is in it. */
export const withoutKeys = <T>(record: Record<string, T>, keys: readonly string[]): Record<string, T> => {
  const gone = new Set(keys);
  return keys.some((key) => key in record)
    ? Object.fromEntries(Object.entries(record).filter(([key]) => !gone.has(key)))
    : record;
};

const emptyLevel = (): LevelHeights => ({ points: {}, arrows: {} });

/** The layout with the heights of one level changed. */
export function inLevel(layout: PathLayout, level: Level, change: (current: LevelHeights) => LevelHeights): PathLayout {
  const kept = layout.heights?.[level];
  const current: LevelHeights = { ...emptyLevel(), ...kept };
  const next = change(current);
  if (next.points === current.points && next.arrows === current.arrows) return layout;
  return { ...layout, heights: { ...layout.heights, [level]: next } };
}

/** One change per path, made from the entries that belong to it. */
export const forEachOwner = <T>(groups: Map<string, T[]>, make: (entries: T[]) => LayoutChange) =>
  new Map([...groups].map(([pathId, entries]): [string, LayoutChange] => [pathId, make(entries)]));
