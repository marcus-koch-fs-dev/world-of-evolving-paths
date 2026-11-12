import {
  addBranch,
  addPoint,
  indexPoints,
  isIsoDate,
  movePoint,
  removePoint,
  type StorePoint,
  updatePath,
  updatePoint,
} from 'world-of-evolving-paths';
import type { NextPointInput } from 'world-of-evolving-paths/react';
import type { DemoAction, DemoState } from './state';

type Of<T extends DemoAction['type']> = Extract<DemoAction, { type: T }>;

/** The id of a point the user adds. One place for the format, so the app can predict it. */
export const customPointId = (nextId: number) => `custom-${nextId}`;

/** The message to show when a new point cannot be created, or null when the input is fine. */
export function nextPointProblem(input: NextPointInput): string | null {
  if (!input.title.trim()) return 'The name is missing.';
  if (!isIsoDate(input.date)) return 'The date is not valid.';
  return null;
}

const newPoint = (id: string, date: string, title: string, prio: number): StorePoint => ({
  id,
  date,
  title,
  kind: 'milestone',
  status: 'open',
  prio,
});

/** A point the user adds on the map or in a line. It gets its height on the level where it was added. */
function add(state: DemoState, { level, branchId, height, date, prio }: Of<'add'>): DemoState {
  const id = customPointId(state.nextId);
  const added = addPoint(state.store, branchId, newPoint(id, date, 'New point', prio));
  return { ...state, store: level === null ? added : movePoint(added, level, id, height), nextId: state.nextId + 1 };
}

/** The point after another one: in the same branch, or as the first point of a new branch that forks off from it. */
function addNext(state: DemoState, { fromId, input }: Of<'addNext'>): DemoState {
  const from = indexPoints(state.store.paths).get(fromId);
  if (!from) return state;
  const id = customPointId(state.nextId);
  // The new point is as important as the one it follows, so it shows in the same levels
  const point = newPoint(id, input.date, input.title.trim(), from.point.prio);
  const branchId = input.newBranch ? `custom-branch-${state.nextId}` : from.branchId;
  const withBranch = input.newBranch
    ? addBranch(state.store, from.pathId, { id: branchId, splitsAt: fromId, points: [] })
    : state.store;
  return { ...state, store: addPoint(withBranch, branchId, point), nextId: state.nextId + 1 };
}

/** A point was changed in the menu. */
const update = (state: DemoState, { id, patch }: Of<'update'>): DemoState => ({
  ...state,
  store: updatePoint(state.store, id, patch),
});

/** The point and the things that depend on it go. */
const remove = (state: DemoState, { id }: Of<'delete'>): DemoState => ({
  ...state,
  store: removePoint(state.store, id),
});

const pathColor = (state: DemoState, { pathId, color }: Of<'pathColor'>): DemoState => ({
  ...state,
  store: updatePath(state.store, pathId, { color }),
});

/** The actions that change the points and paths themselves. */
export const pointActions = { add, addNext, update, delete: remove, pathColor };
