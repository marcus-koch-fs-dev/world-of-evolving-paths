import { checkIn, type Level, type Store, type StorePath } from 'world-of-evolving-paths';
import type { NextPointInput, PointPatch } from 'world-of-evolving-paths/react';
import { pointActions } from './pointActions';
import { storeActions } from './storeActions';

/** What the demo app keeps. The library keeps none of it. */
export type DemoState = {
  /** The paths with their branches, points and layout (heights per level, free places). */
  store: Store;
  nextId: number;
};

export type DemoAction =
  // The user moved something on the map: a point, an arrow, a whole path. The map hands over the paths it touched.
  | { type: 'setLayout'; changed: StorePath[] }
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
export function initialState(store: Store): DemoState {
  return { store, nextId: 1 };
}

/** The message to show when a new point cannot be created, or null when the input is fine. */
export { nextPointProblem } from './pointActions';

/** A path is walked on a day. The library keeps the day in the path and ignores a second check-in on one day. */
function checkInAction(state: DemoState, { pathId, date }: Extract<DemoAction, { type: 'checkIn' }>): DemoState {
  const store = checkIn(state.store, pathId, date);
  return store === state.store ? state : { ...state, store };
}

type Handlers = {
  [K in DemoAction['type']]: (state: DemoState, action: Extract<DemoAction, { type: K }>) => DemoState;
};

const HANDLERS: Handlers = { ...storeActions, ...pointActions, checkIn: checkInAction };

/** The app's rules for how its data changes. Pure, so it is easy to test. */
export function reduce(state: DemoState, action: DemoAction): DemoState {
  return (HANDLERS[action.type] as (state: DemoState, action: DemoAction) => DemoState)(state, action);
}
