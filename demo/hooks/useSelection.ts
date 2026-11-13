import { useMemo, useState } from 'react';
import { indexPoints } from 'world-of-evolving-paths';
import type { DemoState } from '../app-logic/state';

/**
 * The point the user selected, with its path. A point that is not in the current view is not selected, so its menu
 * does not linger.
 */
export function useSelection(state: DemoState, visibleIds: ReadonlySet<string>) {
  const [selectedId, select] = useState<string | null>(null);
  const infos = useMemo(() => indexPoints(state.store.paths), [state.store.paths]);
  const forkPoints = useMemo(
    () => new Set(state.store.paths.flatMap((path) => path.branches.flatMap((b) => (b.splitsAt ? [b.splitsAt] : [])))),
    [state.store.paths],
  );
  const info = selectedId !== null && visibleIds.has(selectedId) ? infos.get(selectedId) : undefined;
  const path = state.store.paths.find((candidate) => candidate.id === info?.pathId);
  return {
    /** Every point by id, for the places that need to look one up. */
    infos,
    select,
    point: info?.point,
    path,
    /** Does a branch of another line leave from the selected point? */
    isFork: info !== undefined && forkPoints.has(info.point.id),
  };
}

export type Selection = ReturnType<typeof useSelection>;
