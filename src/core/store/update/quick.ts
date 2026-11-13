import { todayLocal } from '../../dates.js';
import type { PointKind, PointStatus } from '../../types.js';
import type { Store, StorePoint } from '../types.js';
import { addPoint, updatePoint } from './edit.js';

/** What a new point needs from the app. Everything but the title has a default. */
export type NewPointInput = {
  title: string;
  /** `YYYY-MM-DD`. Default: today. */
  date?: string;
  /** Default `milestone`. */
  kind?: PointKind;
  /** Default `open`. */
  status?: PointStatus;
  /** 1 to 5. Default 3. */
  prio?: number;
  note?: string;
  /** Default: made for you. */
  id?: string;
};

/** An id that is unique in practice. `crypto.randomUUID` only exists on secure pages, so there is a fallback. */
const newId = (prefix: string): string =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`}`;

/**
 * Adds a point at the end of the main branch of a path (the first branch that does not fork off). Name, date, kind and
 * the rest have defaults, so `addNextPoint(store, 'gym', { title: 'Muscle-up' })` is enough. `today` is the date used
 * when none is given. Changes nothing when the path does not exist.
 */
export function addNextPoint(store: Store, pathId: string, input: NewPointInput, today: string = todayLocal()): Store {
  const path = store.paths.find((candidate) => candidate.id === pathId);
  const branch = path?.branches.find((candidate) => candidate.splitsAt === undefined) ?? path?.branches[0];
  if (!path || !branch) return store;
  const point: StorePoint = {
    id: input.id ?? newId(pathId),
    date: input.date ?? today,
    title: input.title,
    kind: input.kind ?? 'milestone',
    status: input.status ?? 'open',
    prio: input.prio ?? 3,
    ...(input.note === undefined ? {} : { note: input.note }),
  };
  return addPoint(store, branch.id, point);
}

/** Sets the status of a point, for example to `done` when the user ticks it off. */
export const setStatus = (store: Store, pointId: string, status: PointStatus): Store =>
  updatePoint(store, pointId, { status });
