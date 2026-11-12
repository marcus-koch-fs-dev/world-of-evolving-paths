import type { Store, StoreChanges, StorePath } from './types.js';

/**
 * What changed between two stores, for saving only that: the paths that are new or different, whole, and the ids of
 * the paths that are gone. A path counts as unchanged when it is the same object, which is why the map and the update
 * functions keep untouched paths as they are. Cost: one look at every path, no deep comparison.
 */
export function storeChanges(before: Store, after: Store): StoreChanges {
  const known = new Set(before.paths);
  const present = new Set(after.paths.map((path) => path.id));
  return {
    changed: after.paths.filter((path) => !known.has(path)),
    removed: before.paths.filter((path) => !present.has(path.id)).map((path) => path.id),
  };
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
