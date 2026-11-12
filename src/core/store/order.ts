import type { Branch, StorePath, StorePoint } from './types.js';

/** A point together with where it lives. */
export type PointInfo = { point: StorePoint; pathId: string; branchId: string; branchIndex: number };

/** Time order. At the same date the id decides, so the order is the same everywhere. */
export function compareByDate(a: StorePoint, b: StorePoint): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}

/** The points in time order. */
export const sortedPoints = (points: readonly StorePoint[]): StorePoint[] => [...points].sort(compareByDate);

/** Every point by id, with its path and branch. */
export function indexPoints(paths: readonly StorePath[]): Map<string, PointInfo> {
  return new Map(
    paths.flatMap((path) =>
      path.branches.flatMap((branch, branchIndex) =>
        branch.points.map((point): [string, PointInfo] => [
          point.id,
          { point, pathId: path.id, branchId: branch.id, branchIndex },
        ]),
      ),
    ),
  );
}

/** Every branch by id, with its path. */
export function indexBranches(paths: readonly StorePath[]): Map<string, { path: StorePath; branch: Branch }> {
  return new Map(
    paths.flatMap((path) =>
      path.branches.map((branch): [string, { path: StorePath; branch: Branch }] => [branch.id, { path, branch }]),
    ),
  );
}
