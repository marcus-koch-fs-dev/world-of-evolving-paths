import type { Position } from '../types.js';
import { pathOfArrow } from './layout.js';
import {
  changeLayouts,
  forEachOwner,
  groupedByOwner,
  inLevel,
  type LayoutChange,
  pointOwners,
  withoutKeys,
} from './layoutChange.js';
import { LEVELS } from './levels.js';
import type { Level, Store } from './types.js';

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
