import { withoutPointLayout } from '../layoutEdits.js';
import { compareByDate, indexPoints, sortedPoints } from '../order.js';
import type { Branch, Store, StorePath, StorePoint } from '../types.js';
import { keepArrows } from './reshape.js';

/** The fields of a point the app may change. */
export type StorePointPatch = Partial<Omit<StorePoint, 'id'>>;

/** Changes branches. A branch that comes back the same keeps its object, and so does a path with only such branches. */
const mapBranches = (store: Store, change: (branch: Branch, path: StorePath) => Branch): Store => ({
  ...store,
  paths: store.paths.map((path) => {
    const branches = path.branches.map((branch) => change(branch, path));
    return branches.every((branch, index) => branch === path.branches[index]) ? path : { ...path, branches };
  }),
});

const holds = (branch: Branch, id: string) => branch.points.some((point) => point.id === id);

/**
 * Changes a point. The heights stay valid: a new prio only decides on which levels the point shows, and the arrows
 * next to a point that appears or disappears there keep their heights. Only the path of the point changes.
 */
export function updatePoint(store: Store, id: string, patch: StorePointPatch): Store {
  const changed = mapBranches(store, (branch) =>
    holds(branch, id)
      ? { ...branch, points: branch.points.map((point) => (point.id === id ? { ...point, ...patch } : point)) }
      : branch,
  );
  return patch.prio !== undefined || patch.date !== undefined ? keepArrows(store, changed, id) : changed;
}

/** Puts a point into a branch. Its place in time follows from its date. The arrows around it keep their heights. */
export function addPoint(store: Store, branchId: string, point: StorePoint): Store {
  const added = mapBranches(store, (branch) =>
    branch.id === branchId ? { ...branch, points: [...branch.points, point] } : branch,
  );
  return keepArrows(store, added, point.id);
}

/** Adds a branch to a path. */
export const addBranch = (store: Store, pathId: string, branch: Branch): Store => ({
  ...store,
  paths: store.paths.map((path) => (path.id === pathId ? { ...path, branches: [...path.branches, branch] } : path)),
});

/** Adds a path. */
export const addPath = (store: Store, path: StorePath): Store => ({ ...store, paths: [...store.paths, path] });

/** Changes name, color or lane of a path. */
export const updatePath = (
  store: Store,
  id: string,
  patch: Partial<Pick<StorePath, 'name' | 'color' | 'lane'>>,
): Store => ({
  ...store,
  paths: store.paths.map((path) => (path.id === id ? { ...path, ...patch } : path)),
});

/**
 * Removes a point with its kept heights. A branch that forked off from it now forks off from the point before it in
 * its branch, or from nowhere when there is none.
 */
export function removePoint(store: Store, id: string): Store {
  const info = indexPoints(store.paths).get(id);
  if (!info) return store;
  const before = sortedPoints(
    store.paths.flatMap((path) =>
      path.branches.filter((branch) => branch.id === info.branchId).flatMap((b) => b.points),
    ),
  )
    .filter((point) => compareByDate(point, info.point) < 0)
    .at(-1);
  const cleaned = mapBranches(store, (branch) =>
    holds(branch, id) || branch.splitsAt === id
      ? {
          ...branch,
          points: branch.points.filter((point) => point.id !== id),
          ...(branch.splitsAt === id ? { splitsAt: before?.id } : {}),
        }
      : branch,
  );
  return withoutPointLayout(keepArrows(store, cleaned, id), info.pathId, id);
}
