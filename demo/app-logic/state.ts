import { isIsoDate, type PathInfo, type Position } from 'world-of-evolving-paths';
import type { NextPointInput, PointPatch } from 'world-of-evolving-paths/react';
import { hasCheckedIn } from './checkIn';
import type { CheckIn, DemoPoint } from './types';

/** What the demo app keeps. The library keeps none of it. */
export type DemoState = {
  paths: PathInfo[];
  points: DemoPoint[];
  checkIns: CheckIn[];
  /** Pinned positions per view key, then per point id. */
  pins: Record<string, Record<string, Position>>;
  /** Layout seed per view key. */
  seeds: Record<string, number>;
  nextId: number;
};

export type DemoAction =
  | { type: 'move'; viewKey: string; positions: Record<string, Position> }
  | { type: 'add'; viewKey: string; pathId: string; x: number; y: number; date: string; importance: number }
  | { type: 'addNext'; fromId: string; input: NextPointInput }
  | { type: 'update'; id: string; patch: PointPatch }
  | { type: 'pathColor'; pathId: string; color: string }
  | { type: 'delete'; id: string }
  | { type: 'reroll'; viewKey: string }
  | { type: 'checkIn'; pathId: string; date: string }
  | { type: 'connect'; fromId: string; toId: string };

export const DEFAULT_SEED = 1;

/** The state the demo starts with. */
export function initialState(paths: PathInfo[], points: DemoPoint[], checkIns: CheckIn[] = []): DemoState {
  return { paths, points, checkIns, pins: {}, seeds: {}, nextId: 1 };
}

/** The message to show when a new point cannot be created, or null when the input is fine. */
export function nextPointProblem(input: NextPointInput): string | null {
  if (!input.title.trim()) return 'The name is missing.';
  if (!isIsoDate(input.date)) return 'The date is not valid.';
  return null;
}

/** The id of a point the user adds. One place for the format, so the app can predict it. */
export const customPointId = (nextId: number) => `custom-${nextId}`;

/** Does following the connections from `startId` lead to `targetId`? `nextOf` maps each id to the ids it links to. */
function leadsTo(
  nextOf: ReadonlyMap<string, readonly string[]>,
  startId: string,
  targetId: string,
  seen = new Set<string>(),
): boolean {
  if (startId === targetId) return true;
  if (seen.has(startId)) return false;
  seen.add(startId);
  return (nextOf.get(startId) ?? []).some((id) => leadsTo(nextOf, id, targetId, seen));
}

/** The message to show when two points cannot be connected, or null when they can. */
export function connectProblem(points: DemoPoint[], fromId: string, toId: string): string | null {
  const from = points.find((point) => point.id === fromId);
  if (!from || fromId === toId) return 'Pick another point to connect to.';
  if (from.next.includes(toId)) return 'These points are already connected.';
  if (leadsTo(new Map(points.map((point) => [point.id, point.next])), toId, fromId))
    return 'That would make a circle. A path only runs forward.';
  return null;
}

function connectPoints(state: DemoState, fromId: string, toId: string): DemoState {
  if (connectProblem(state.points, fromId, toId)) return state;
  return {
    ...state,
    points: state.points.map((point) => (point.id === fromId ? { ...point, next: [...point.next, toId] } : point)),
  };
}

function addPoint(state: DemoState, action: Extract<DemoAction, { type: 'add' }>): DemoState {
  const id = customPointId(state.nextId);
  const point: DemoPoint = {
    id,
    pathId: action.pathId,
    date: action.date,
    title: 'New point',
    kind: 'milestone',
    status: 'open',
    importance: action.importance,
    next: [],
  };
  const pins = { ...state.pins[action.viewKey], [id]: { x: action.x, y: action.y } };
  return {
    ...state,
    points: [...state.points, point],
    pins: { ...state.pins, [action.viewKey]: pins },
    nextId: state.nextId + 1,
  };
}

function addNextPoint(state: DemoState, { fromId, input }: Extract<DemoAction, { type: 'addNext' }>): DemoState {
  const from = state.points.find((point) => point.id === fromId);
  if (!from) return state;
  const id = customPointId(state.nextId);
  const newPath: PathInfo | null = input.newPath
    ? {
        id: `custom-path-${state.nextId}`,
        name: input.pathName.trim() || input.title.trim(),
        color: input.color,
        lane: state.paths.length,
      }
    : null;
  const point: DemoPoint = {
    id,
    pathId: newPath?.id ?? from.pathId,
    date: input.date,
    title: input.title.trim(),
    kind: 'milestone',
    status: 'open',
    next: [],
    // The new point is as important as the one it follows, so it shows in the same views
    importance: from.importance,
  };
  return {
    ...state,
    paths: newPath ? [...state.paths, newPath] : state.paths,
    points: [
      ...state.points.map((candidate) =>
        candidate.id === fromId ? { ...candidate, next: [...candidate.next, id] } : candidate,
      ),
      point,
    ],
    nextId: state.nextId + 1,
  };
}

/** A path is walked on a day. Checking in twice on one day does not count twice. */
function addCheckIn(state: DemoState, pathId: string, date: string): DemoState {
  return hasCheckedIn(state.checkIns, pathId, date)
    ? state
    : { ...state, checkIns: [...state.checkIns, { pathId, date }] };
}

function deletePoint(state: DemoState, id: string): DemoState {
  const pins = Object.fromEntries(
    Object.entries(state.pins).map(([viewKey, positions]) => [
      viewKey,
      Object.fromEntries(Object.entries(positions).filter(([pinned]) => pinned !== id)),
    ]),
  );
  return {
    ...state,
    points: state.points
      .filter((point) => point.id !== id)
      .map((point) => ({ ...point, next: point.next.filter((nextId) => nextId !== id) })),
    pins,
  };
}

/** The app's rules for how its data changes. Pure, so it is easy to test. */
export function reduce(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'move':
      return { ...state, pins: { ...state.pins, [action.viewKey]: action.positions } };
    case 'add':
      return addPoint(state, action);
    case 'addNext':
      return addNextPoint(state, action);
    case 'update':
      return {
        ...state,
        points: state.points.map((point) => (point.id === action.id ? { ...point, ...action.patch } : point)),
      };
    case 'pathColor':
      return {
        ...state,
        paths: state.paths.map((path) => (path.id === action.pathId ? { ...path, color: action.color } : path)),
      };
    case 'delete':
      return deletePoint(state, action.id);
    case 'checkIn':
      return addCheckIn(state, action.pathId, action.date);
    case 'connect':
      return connectPoints(state, action.fromId, action.toId);
    case 'reroll':
      return {
        ...state,
        pins: { ...state.pins, [action.viewKey]: {} },
        seeds: { ...state.seeds, [action.viewKey]: (state.seeds[action.viewKey] ?? DEFAULT_SEED) + 1 },
      };
  }
}
