import type { Position } from '../types.js';
import { LEVELS } from './levels.js';
import { indexPoints } from './order.js';
import type { Level, LevelHeights, PathLayout, Store, StorePath } from './types.js';

const NO_LAYOUT: PathLayout = {};

/** The height kept for a point on a level, or undefined. */
export const keptPointHeight = (path: StorePath, level: Level, id: string): number | undefined =>
  path.layout?.heights?.[level]?.points?.[id];

/** The height kept for an arrow on a level, or undefined. */
export const keptArrowHeight = (path: StorePath, level: Level, key: string): number | undefined =>
  path.layout?.heights?.[level]?.arrows?.[key];

/** The free place kept for a point, or undefined. */
export const keptFreePlace = (path: StorePath, id: string): Position | undefined => path.layout?.free?.[id];

/** The path an arrow belongs to: the key starts with its id (see `arrowKey`). */
export const pathOfArrow = (key: string): string => key.slice(0, key.indexOf('/'));

/** What to do with the layout of one path. Returning the layout it got means nothing changed. */
type LayoutChange = (layout: PathLayout) => PathLayout;

/** The store with the layouts of some paths changed. Paths that stay the same, or whose layout does, stay the same objects. */
function changeLayouts(store: Store, changes: ReadonlyMap<string, LayoutChange>): Store {
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
function groupedByOwner<T>(
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
function pointOwners(store: Store): (id: string) => string | undefined {
  const infos = indexPoints(store.paths);
  return (id) => infos.get(id)?.pathId;
}

const withoutKeys = <T>(record: Record<string, T>, keys: readonly string[]): Record<string, T> => {
  const gone = new Set(keys);
  return keys.some((key) => key in record)
    ? Object.fromEntries(Object.entries(record).filter(([key]) => !gone.has(key)))
    : record;
};

const emptyLevel = (): LevelHeights => ({ points: {}, arrows: {} });

/** The layout with the heights of one level changed. */
function inLevel(layout: PathLayout, level: Level, change: (current: LevelHeights) => LevelHeights): PathLayout {
  const kept = layout.heights?.[level];
  const current: LevelHeights = { ...emptyLevel(), ...kept };
  const next = change(current);
  if (next.points === current.points && next.arrows === current.arrows) return layout;
  return { ...layout, heights: { ...layout.heights, [level]: next } };
}

const forEachOwner = <T>(groups: Map<string, T[]>, make: (entries: T[]) => LayoutChange) =>
  new Map([...groups].map(([pathId, entries]): [string, LayoutChange] => [pathId, make(entries)]));

/** The store with some point heights set on a level. Each one goes to the path of its point. */
export const withPointHeights = (store: Store, level: Level, heights: Record<string, number>): Store =>
  changeLayouts(
    store,
    forEachOwner(
      groupedByOwner(heights, pointOwners(store)),
      (entries) => (layout) =>
        inLevel(layout, level, (current) => ({
          ...current,
          points: { ...current.points, ...Object.fromEntries(entries) },
        })),
    ),
  );

/** The store with some arrow heights set on a level. Each one goes to the path in its key. */
export const withArrowHeights = (store: Store, level: Level, heights: Record<string, number>): Store =>
  changeLayouts(
    store,
    forEachOwner(
      groupedByOwner(heights, pathOfArrow),
      (entries) => (layout) =>
        inLevel(layout, level, (current) => ({
          ...current,
          arrows: { ...current.arrows, ...Object.fromEntries(entries) },
        })),
    ),
  );

/** The store with some free places set. Each one goes to the path of its point. */
export const withFreePlaces = (store: Store, places: Record<string, Position>): Store =>
  changeLayouts(
    store,
    forEachOwner(groupedByOwner(places, pointOwners(store)), (entries) => (layout) => ({
      ...layout,
      free: { ...layout.free, ...Object.fromEntries(entries) },
    })),
  );

/** The store with the kept heights of some points and arrows on a level forgotten. */
export function withoutHeights(
  store: Store,
  level: Level,
  pointIds: readonly string[],
  arrowKeys: readonly string[],
): Store {
  const ownerOfPoint = pointOwners(store);
  const forget =
    (ids: readonly string[], keys: readonly string[]): LayoutChange =>
    (layout) =>
      inLevel(layout, level, (current) => ({
        points: withoutKeys(current.points, ids),
        arrows: withoutKeys(current.arrows, keys),
      }));
  // What to forget, per path: the ids of its points and the keys of its arrows
  const wanted = [
    ...pointIds.map((id): [string | undefined, 'ids' | 'keys', string] => [ownerOfPoint(id), 'ids', id]),
    ...arrowKeys.map((key): [string | undefined, 'ids' | 'keys', string] => [pathOfArrow(key), 'keys', key]),
  ].reduce((all, [owner, kind, value]) => {
    if (owner === undefined) return all;
    const own = all.get(owner) ?? { ids: [], keys: [] };
    own[kind].push(value);
    return all.set(owner, own);
  }, new Map<string, { ids: string[]; keys: string[] }>());
  return changeLayouts(
    store,
    new Map([...wanted].map(([pathId, { ids, keys }]): [string, LayoutChange] => [pathId, forget(ids, keys)])),
  );
}

/** The store without what is kept in a path for a point: its heights on every level and its free place. */
export function withoutPointLayout(store: Store, owner: string, id: string): Store {
  const forget: LayoutChange = (layout) => {
    const levelsDone = LEVELS.reduce(
      (current, level) =>
        inLevel(current, level, (heights) => ({ ...heights, points: withoutKeys(heights.points, [id]) })),
      layout,
    );
    const free = levelsDone.free && id in levelsDone.free ? withoutKeys(levelsDone.free, [id]) : levelsDone.free;
    return free === levelsDone.free ? levelsDone : { ...levelsDone, free };
  };
  return changeLayouts(store, new Map([[owner, forget]]));
}
