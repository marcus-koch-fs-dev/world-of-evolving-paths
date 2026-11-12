import { indexPoints, type Store, sortedPoints } from 'world-of-evolving-paths';

/** A point can be completed once the point before it in its branch is done. */
export function canComplete(store: Store, id: string): boolean {
  const info = indexPoints(store.paths).get(id);
  if (!info) return true;
  const branch = store.paths.flatMap((path) => path.branches).find((candidate) => candidate.id === info.branchId);
  const ordered = sortedPoints(branch?.points ?? []);
  const before = ordered[ordered.findIndex((point) => point.id === id) - 1];
  return before === undefined || before.status === 'done';
}
