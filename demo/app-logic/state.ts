import { isIsoDate, type PathInfo } from 'world-of-evolving-paths';
import type { NextPointInput, PointPatch } from 'world-of-evolving-paths/react';
import { hasCheckedIn } from './checkIn';
import { connectionKey, involves } from './connection';
import type { CheckIn, DemoPoint } from './types';

/** What the demo app keeps. The library keeps none of it. */
export type DemoState = {
  paths: PathInfo[];
  points: DemoPoint[];
  checkIns: CheckIn[];
  /**
   * The height of a point, per point id, as a distance from the lane of its path. One height for every view: where the
   * point sits along the time axis is always its date.
   */
  heights: Record<string, number>;
  /**
   * Where a path enters and leaves a period: per period key, then per connection (`connectionKey`), as a distance from
   * the lane. The edge of a week lies on another date than the edge of a month, so each period keeps its own.
   * Without an entry the height follows from the heights of the two points of the connection.
   */
  edgeHeights: Record<string, Record<string, number>>;
  /** Layout seed per view key. */
  seeds: Record<string, number>;
  nextId: number;
};

export type DemoAction =
  // A point was dragged to a height: its distance from the lane of its path
  | { type: 'move'; id: string; height: number }
  | { type: 'add'; pathId: string; height: number; date: string; importance: number }
  | { type: 'addNext'; fromId: string; input: NextPointInput }
  // A point in the middle of a line: the line from `fromId` to `toId` now runs through it
  | { type: 'insert'; fromId: string; toId: string; height: number; date: string; importance: number }
  // The end of a line that leaves a period or spans it was dragged: the period, the connection and the height
  | { type: 'edgeHeight'; periodKey: string; fromId: string; toId: string; height: number }
  | { type: 'update'; id: string; patch: PointPatch }
  | { type: 'pathColor'; pathId: string; color: string }
  | { type: 'delete'; id: string }
  // Another layout for a view: `pointIds` are the points it shows, they let go of their heights
  | { type: 'reroll'; viewKey: string; pointIds: readonly string[] }
  | { type: 'checkIn'; pathId: string; date: string }
  | { type: 'connect'; fromId: string; toId: string };

export const DEFAULT_SEED = 1;

/** The state the demo starts with. */
export function initialState(paths: PathInfo[], points: DemoPoint[], checkIns: CheckIn[] = []): DemoState {
  return { paths, points, checkIns, heights: {}, edgeHeights: {}, seeds: {}, nextId: 1 };
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
  return {
    ...state,
    points: [...state.points, point],
    heights: { ...state.heights, [id]: action.height },
    nextId: state.nextId + 1,
  };
}

const clampDate = (date: string, earliest: string, latest: string) =>
  date < earliest ? earliest : date > latest ? latest : date;

/**
 * Puts a new point into the line between two points. The line may run across hidden points, so the new point goes in
 * after the first point of the line: it takes the place of that link and leads on to it. Its date lies between the two.
 */
function insertPoint(state: DemoState, action: Extract<DemoAction, { type: 'insert' }>): DemoState {
  const from = state.points.find((point) => point.id === action.fromId);
  const nextOf = new Map(state.points.map((point) => [point.id, point.next]));
  const link = from?.next.find((id) => leadsTo(nextOf, id, action.toId));
  const linked = state.points.find((point) => point.id === link);
  if (!from || !link || !linked) return state;
  const id = customPointId(state.nextId);
  const point: DemoPoint = {
    id,
    pathId: from.pathId,
    date: clampDate(action.date, from.date, linked.date),
    title: 'New point',
    kind: 'milestone',
    status: 'open',
    importance: action.importance,
    next: [link],
  };
  return {
    ...state,
    points: [
      ...state.points.map((candidate) =>
        candidate.id === from.id
          ? { ...candidate, next: candidate.next.map((nextId) => (nextId === link ? id : nextId)) }
          : candidate,
      ),
      point,
    ],
    heights: { ...state.heights, [id]: action.height },
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
        name: input.pathName?.trim() || input.title.trim(),
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

/**
 * The connections of a point after the point `removedId` is gone. A point that led to it now leads to what it led to,
 * so the path stays whole. Nothing leads to itself, and nothing twice.
 */
function bridged(point: DemoPoint, removedId: string, successors: readonly string[]): string[] {
  if (!point.next.includes(removedId)) return point.next;
  const replaced = point.next.flatMap((nextId) => (nextId === removedId ? successors : [nextId]));
  return [...new Set(replaced)].filter((nextId) => nextId !== point.id);
}

function deletePoint(state: DemoState, id: string): DemoState {
  const successors = state.points.find((point) => point.id === id)?.next ?? [];
  const edgeHeights = Object.fromEntries(
    Object.entries(state.edgeHeights).map(([periodKey, heights]) => [
      periodKey,
      Object.fromEntries(Object.entries(heights).filter(([key]) => !involves(key, id))),
    ]),
  );
  return {
    ...state,
    points: state.points
      .filter((point) => point.id !== id)
      .map((point) => ({ ...point, next: bridged(point, id, successors) })),
    heights: omit(state.heights, [id]),
    edgeHeights,
  };
}

/** A record without some keys. */
function omit<T>(record: Record<string, T>, keys: readonly string[]): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)));
}

/** The height where a path enters or leaves one period, for one connection. Other periods keep theirs. */
function setEdgeHeight(state: DemoState, action: Extract<DemoAction, { type: 'edgeHeight' }>): DemoState {
  const ofPeriod = {
    ...state.edgeHeights[action.periodKey],
    [connectionKey(action.fromId, action.toId)]: action.height,
  };
  return { ...state, edgeHeights: { ...state.edgeHeights, [action.periodKey]: ofPeriod } };
}

/** The app's rules for how its data changes. Pure, so it is easy to test. */
export function reduce(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'move':
      // One height for the point, in every view
      return { ...state, heights: { ...state.heights, [action.id]: action.height } };
    case 'add':
      return addPoint(state, action);
    case 'addNext':
      return addNextPoint(state, action);
    case 'insert':
      return insertPoint(state, action);
    case 'edgeHeight':
      return setEdgeHeight(state, action);
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
        // Another layout also lets go of the heights the user chose for the points of this view
        heights: omit(state.heights, action.pointIds),
        seeds: { ...state.seeds, [action.viewKey]: (state.seeds[action.viewKey] ?? DEFAULT_SEED) + 1 },
      };
  }
}
