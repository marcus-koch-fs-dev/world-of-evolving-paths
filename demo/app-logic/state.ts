import { isIsoDate, type PathInfo } from 'world-of-evolving-paths';
import type { NextPointInput, PointPatch } from 'world-of-evolving-paths/react';
import { hasCheckedIn } from './checkIn';
import { crossesAt } from './connection';
import type { HeightLevel } from './heightLevel';
import { changeAllLevels, changeLevel, emptyHeights, type LevelHeights, omitKeys } from './heights';
import { leadsTo } from './reach';
import type { CheckIn, DemoPoint } from './types';

/** What the demo app keeps. The library keeps none of it. */
export type DemoState = {
  paths: PathInfo[];
  points: DemoPoint[];
  checkIns: CheckIn[];
  /**
   * The height of a point, per level and point id, as a distance from the lane of its path. A week, a month and a year
   * have different scales, so each keeps its own. Where the point sits along the time axis is always its date.
   * Without a height the layout places the point.
   */
  heights: LevelHeights;
  /**
   * The height where a path crosses the border between two periods, per level and crossing (`boundaryKey`), as a
   * distance from the lane. The period before the border and the period after it share one height. Without an entry the
   * line takes the heights of its two neighbours.
   */
  boundaryHeights: LevelHeights;
  /** Layout seed per view key. */
  seeds: Record<string, number>;
  nextId: number;
};

export type DemoAction =
  // A point was dragged to a height: its distance from the lane of its path, kept for the level of the view.
  // `followers` are the heights of the points after it, which stay where they are so that a point moves alone.
  // A `level` of null is an overview, which keeps no heights.
  | { type: 'move'; level: HeightLevel | null; id: string; height: number; followers?: Record<string, number> }
  | { type: 'add'; level: HeightLevel | null; pathId: string; height: number; date: string; importance: number }
  | { type: 'addNext'; fromId: string; input: NextPointInput }
  // A point in the middle of a line: the line from `fromId` to `toId` now runs through it
  | {
      type: 'insert';
      level: HeightLevel | null;
      fromId: string;
      toId: string;
      height: number;
      date: string;
      importance: number;
    }
  // A whole path was moved in a view: the new heights of its points and of where its lines cross the borders
  | {
      type: 'shiftPath';
      level: HeightLevel | null;
      heights: Record<string, number>;
      boundaries: Record<string, number>;
    }
  // The arrow at the end of a line was dragged: where the connection crosses a border of the period (`boundaryKey`)
  | { type: 'boundaryHeight'; level: HeightLevel | null; key: string; height: number }
  | { type: 'update'; id: string; patch: PointPatch }
  | { type: 'pathColor'; pathId: string; color: string }
  | { type: 'delete'; id: string }
  // Another layout for a view: `pointIds` are the points it shows, they let go of their heights on its level
  | { type: 'reroll'; level: HeightLevel | null; viewKey: string; pointIds: readonly string[] }
  | { type: 'checkIn'; pathId: string; date: string }
  | { type: 'connect'; fromId: string; toId: string };

export const DEFAULT_SEED = 1;

/** The state the demo starts with. */
export function initialState(paths: PathInfo[], points: DemoPoint[], checkIns: CheckIn[] = []): DemoState {
  return {
    paths,
    points,
    checkIns,
    heights: emptyHeights(),
    boundaryHeights: emptyHeights(),
    seeds: {},
    nextId: 1,
  };
}

/** The message to show when a new point cannot be created, or null when the input is fine. */
export function nextPointProblem(input: NextPointInput): string | null {
  if (!input.title.trim()) return 'The name is missing.';
  if (!isIsoDate(input.date)) return 'The date is not valid.';
  return null;
}

/** The id of a point the user adds. One place for the format, so the app can predict it. */
export const customPointId = (nextId: number) => `custom-${nextId}`;

/** The message to show when two points cannot be connected, or null when they can. */
export function connectProblem(points: DemoPoint[], fromId: string, toId: string): string | null {
  const from = points.find((point) => point.id === fromId);
  if (!from || fromId === toId || !points.some((point) => point.id === toId))
    return 'Pick another point to connect to.';
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
    heights: changeLevel(state.heights, action.level, (current) => ({ ...current, [id]: action.height })),
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
    heights: changeLevel(state.heights, action.level, (current) => ({ ...current, [id]: action.height })),
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
  return {
    ...state,
    points: state.points
      .filter((point) => point.id !== id)
      .map((point) => ({ ...point, next: bridged(point, id, successors) })),
    heights: changeAllLevels(state.heights, (current) => omitKeys(current, [id])),
    boundaryHeights: changeAllLevels(state.boundaryHeights, (current) => withoutInvolving(current, id)),
  };
}

/** The heights at the borders without those of a point. */
const withoutInvolving = (heights: Record<string, number>, pointId: string) =>
  Object.fromEntries(Object.entries(heights).filter(([key]) => !crossesAt(key, pointId)));

/** The app's rules for how its data changes. Pure, so it is easy to test. */
export function reduce(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'move':
      // One height for the point on this level, and the followers keep the heights they had
      return {
        ...state,
        heights: changeLevel(state.heights, action.level, (current) => ({
          ...current,
          ...action.followers,
          [action.id]: action.height,
        })),
      };
    case 'shiftPath':
      return {
        ...state,
        heights: changeLevel(state.heights, action.level, (current) => ({ ...current, ...action.heights })),
        boundaryHeights: changeLevel(state.boundaryHeights, action.level, (current) => ({
          ...current,
          ...action.boundaries,
        })),
      };
    case 'add':
      return addPoint(state, action);
    case 'addNext':
      return addNextPoint(state, action);
    case 'insert':
      return insertPoint(state, action);
    case 'boundaryHeight':
      return {
        ...state,
        boundaryHeights: changeLevel(state.boundaryHeights, action.level, (current) => ({
          ...current,
          [action.key]: action.height,
        })),
      };
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
        // Another layout also lets go of the heights the user chose for the points of this view, on its level
        heights: changeLevel(state.heights, action.level, (current) => omitKeys(current, action.pointIds)),
        seeds: { ...state.seeds, [action.viewKey]: (state.seeds[action.viewKey] ?? DEFAULT_SEED) + 1 },
      };
  }
}
