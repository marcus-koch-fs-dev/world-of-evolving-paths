import type { Level, Store } from 'world-of-evolving-paths';
import type { NextPointInput, PointPatch } from 'world-of-evolving-paths/react';
import { hasCheckedIn } from './checkIn';
import { pointActions } from './pointActions';
import { storeActions } from './storeActions';
import type { CheckIn } from './types';

/** What the demo app keeps. The library keeps none of it. */
export type DemoState = {
  /** The paths with their branches and points, the heights per level, and the free positions. */
  store: Store;
  checkIns: CheckIn[];
  nextId: number;
};

export type DemoAction =
  // The user moved something on the map: a point, an arrow, a whole path. The map hands over the new heights and places.
  | { type: 'setLayout'; heights: Store['heights']; free: Store['free'] }
  // A point on the map or in a line. A `level` of null is an overview, which keeps no heights.
  | { type: 'add'; level: Level | null; branchId: string; height: number; date: string; prio: number }
  | { type: 'addNext'; fromId: string; input: NextPointInput }
  | { type: 'update'; id: string; patch: PointPatch }
  | { type: 'pathColor'; pathId: string; color: string }
  | { type: 'delete'; id: string }
  // The heights the user set in a view are forgotten: points and arrows fall back to their defaults
  | { type: 'resetView'; level: Level; pointIds: readonly string[]; arrowKeys: readonly string[] }
  | { type: 'checkIn'; pathId: string; date: string };

/** The state the demo starts with. */
export function initialState(store: Store, checkIns: CheckIn[] = []): DemoState {
  return { store, checkIns, nextId: 1 };
}

/** The message to show when a new point cannot be created, or null when the input is fine. */
export { nextPointProblem } from './pointActions';

/** A path is walked on a day. Checking in twice on one day does not count twice. */
function checkIn(state: DemoState, { pathId, date }: Extract<DemoAction, { type: 'checkIn' }>): DemoState {
  return hasCheckedIn(state.checkIns, pathId, date)
    ? state
    : { ...state, checkIns: [...state.checkIns, { pathId, date }] };
}

type Handlers = {
  [K in DemoAction['type']]: (state: DemoState, action: Extract<DemoAction, { type: K }>) => DemoState;
};

const HANDLERS: Handlers = { ...storeActions, ...pointActions, checkIn };

/** The app's rules for how its data changes. Pure, so it is easy to test. */
export function reduce(state: DemoState, action: DemoAction): DemoState {
  return (HANDLERS[action.type] as (state: DemoState, action: DemoAction) => DemoState)(state, action);
}
