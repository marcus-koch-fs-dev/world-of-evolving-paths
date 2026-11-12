import type { PathInfo, PlacedPoint, PlacedWorld } from '../src/core/types';

/** A path style with sensible defaults. */
export function makePath(id: string, color = '#3a86ff', lane?: number): PathInfo {
  return { id, name: id, color, lane };
}

/** A point that already has a position, as the scene works with it. Only the id is required. */
export function placedPoint(overrides: Partial<PlacedPoint> & { id: string }, x: number, y = 0): PlacedPoint {
  return {
    pathId: 'combat',
    branchId: 'combat-main',
    date: '2026-11-02',
    title: overrides.id,
    kind: 'milestone',
    status: 'open',
    importance: 3,
    next: [],
    x,
    y,
    ...overrides,
  };
}

/** A world with one red path around the given points, and no arrows. */
export function worldOf(points: PlacedPoint[], today = '2026-11-10'): PlacedWorld {
  return { today, paths: [makePath('combat', '#ff3b3b')], points, arrows: [], spans: [] };
}
