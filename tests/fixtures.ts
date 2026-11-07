import type { Path, PathPoint, PeriodData } from '../src/core/types';

/** A path with sensible defaults. */
export function makePath(id: string, color = '#3a86ff', lane?: number): Path {
  return { id, name: id, color, lane };
}

/** A point with sensible defaults. Only the id is required. */
export function makePoint(overrides: Partial<PathPoint> & { id: string }): PathPoint {
  return {
    pathId: 'combat',
    date: '2026-11-02',
    title: overrides.id,
    kind: 'milestone',
    status: 'open',
    next: [],
    ...overrides,
  };
}

/** Two paths with a few points each, all inside the week of 2026-11-02. */
export function makePeriodData(): PeriodData {
  return {
    paths: [makePath('combat', '#ff3b3b', 0), makePath('magic', '#3a86ff', 1)],
    points: [
      makePoint({ id: 'c1', kind: 'start', status: 'done', date: '2026-11-02', next: ['c2'] }),
      makePoint({ id: 'c2', status: 'done', date: '2026-11-04', next: ['c3'] }),
      makePoint({ id: 'c3', status: 'open', date: '2026-11-07' }),
      makePoint({ id: 'm1', pathId: 'magic', kind: 'start', status: 'done', date: '2026-11-03', next: ['m2'] }),
      makePoint({ id: 'm2', pathId: 'magic', status: 'open', date: '2026-11-08' }),
    ],
  };
}
