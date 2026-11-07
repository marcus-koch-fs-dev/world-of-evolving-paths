import { isIsoDate, type PathInfo, type Position } from 'world-of-evolving-paths';
import type { NextPointInput, PointPatch } from 'world-of-evolving-paths/react';
import type { DemoPoint } from './types';

/** What the demo app keeps. The library keeps none of it. */
export type DemoState = {
  paths: PathInfo[];
  points: DemoPoint[];
  /** Pinned positions per view key, then per point id. */
  pins: Record<string, Record<string, Position>>;
  /** Layout seed per view key. */
  seeds: Record<string, number>;
  nextId: number;
};

export type DemoAction =
  | { type: 'move'; viewKey: string; positions: Record<string, Position> }
  | { type: 'add'; viewKey: string; pathId: string; x: number; y: number; date: string }
  | { type: 'addNext'; fromId: string; input: NextPointInput }
  | { type: 'update'; id: string; patch: PointPatch }
  | { type: 'pathColor'; pathId: string; color: string }
  | { type: 'delete'; id: string }
  | { type: 'reroll'; viewKey: string };

export const DEFAULT_SEED = 1;

export function initialState(paths: PathInfo[], points: DemoPoint[]): DemoState {
  return { paths, points, pins: {}, seeds: {}, nextId: 1 };
}

/** The message to show when a new point cannot be created, or null when the input is fine. */
export function nextPointProblem(input: NextPointInput): string | null {
  if (!input.title.trim()) return 'The name is missing.';
  if (!isIsoDate(input.date)) return 'The date is not valid.';
  return null;
}

function addPoint(state: DemoState, action: Extract<DemoAction, { type: 'add' }>): DemoState {
  const id = `custom-${state.nextId}`;
  const point: DemoPoint = {
    id,
    pathId: action.pathId,
    date: action.date,
    title: 'New point',
    kind: 'milestone',
    status: 'open',
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
  const id = `custom-${state.nextId}`;
  const newPath: PathInfo | null = input.newPath
    ? { id: `custom-path-${state.nextId}`, name: input.title.trim(), color: input.color, lane: state.paths.length }
    : null;
  const point: DemoPoint = {
    id,
    pathId: newPath?.id ?? from.pathId,
    date: input.date,
    title: input.title.trim(),
    kind: 'milestone',
    status: 'open',
    next: [],
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
    case 'reroll':
      return {
        ...state,
        pins: { ...state.pins, [action.viewKey]: {} },
        seeds: { ...state.seeds, [action.viewKey]: (state.seeds[action.viewKey] ?? DEFAULT_SEED) + 1 },
      };
  }
}
