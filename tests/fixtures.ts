import type { FlatPoint, PathInfo, PeriodData, PlacedPoint, PlacedWorld } from '../src/core/types';

/** A path style with sensible defaults. */
export function makePath(id: string, color = '#3a86ff', lane?: number): PathInfo {
  return { id, name: id, color, lane };
}

/** A point with sensible defaults, together with its path id. Only the id is required. */
export function makePoint(overrides: Partial<FlatPoint> & { id: string }): FlatPoint {
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

/** Builds nested period data from path styles and flat points. Paths without points are kept. */
export function nest(paths: PathInfo[], points: FlatPoint[]): PeriodData {
  return {
    paths: paths.map((path) => ({
      ...path,
      points: points.filter((point) => point.pathId === path.id).map(({ pathId: _pathId, ...point }) => point),
    })),
  };
}

/** Two paths with a few points each, all inside the week of 2026-11-02. */
export function makePeriodData(): PeriodData {
  return nest(
    [makePath('combat', '#ff3b3b', 0), makePath('magic', '#3a86ff', 1)],
    [
      makePoint({ id: 'c1', kind: 'start', status: 'done', date: '2026-11-02', next: ['c2'] }),
      makePoint({ id: 'c2', status: 'done', date: '2026-11-04', next: ['c3'] }),
      makePoint({ id: 'c3', status: 'open', date: '2026-11-07' }),
      makePoint({ id: 'm1', pathId: 'magic', kind: 'start', status: 'done', date: '2026-11-03', next: ['m2'] }),
      makePoint({ id: 'm2', pathId: 'magic', status: 'open', date: '2026-11-08' }),
    ],
  );
}

/** A copy of the data in which one point is changed. */
export function editPoint(data: PeriodData, id: string, patch: Record<string, unknown>): PeriodData {
  return {
    paths: data.paths.map((path) => ({
      ...path,
      points: path.points.map((point) => (point.id === id ? { ...point, ...patch } : point)),
    })),
  };
}

/** A point that already has a position, as the scene works with it. */
export function placedPoint(overrides: Partial<PlacedPoint> & { id: string }, x: number, y = 0): PlacedPoint {
  const { x: _x, y: _y, ...rest } = makePoint(overrides);
  return { ...rest, x, y };
}

/** A world with one red path around the given points. */
export function worldOf(points: PlacedPoint[], today = '2026-11-10'): PlacedWorld {
  return { today, paths: [makePath('combat', '#ff3b3b')], points };
}
